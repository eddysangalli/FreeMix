/******************************************************************************
    FreeMix: what the column between Preview and Output has besides the transitions.

    Overlay buttons 1 to 8. Each overlay channel is a keyer of the Downstream Keyer component named "1" to "8"
    (the same ones the input tiles use). A button is lit while its channel is on air. A click does what the
    reference calls OverlayInput: if the channel shows the Preview input it goes off, otherwise the Preview input
    goes on it. The right button menu takes the channel off whatever it shows.

    Master meter. Peak level of output track 1, which is where the Master bus ends, read from the audio mix
    itself, so it shows what is recorded and streamed.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
******************************************************************************/

#include "FreeMixCenterColumn.hpp"
#include "OBSBasic.hpp"

#include <obs.hpp>
#include <obs-frontend-api.h>
#include <qt-wrappers.hpp>

#include "../../plugins/obs-websocket/lib/obs-websocket-api.h"

#include <QGridLayout>
#include <QMenu>
#include <QPainter>
#include <QPointer>
#include <QPushButton>
#include <QTimer>
#include <QCoreApplication>
#include <QDir>
#include <QUrl>
#include <QLabel>
#include <QDateTime>
#ifdef BROWSER_AVAILABLE
#include <docks/BrowserDock.hpp>
#endif

#include <algorithm>
#include <array>
#include <atomic>
#include <cmath>
#include <string>
#include <vector>

namespace {

constexpr int kOverlayCount = 8;
/* Time the exit animation of a title takes; the same wait the input tiles use. */
constexpr int kTitleExitMs = 550;

/* Calls a request of another component through the control server. Null when there is no answer. */
OBSDataAutoRelease CallVendor(const char *vendorName, const char *requestType, obs_data_t *requestData)
{
	OBSDataAutoRelease request = obs_data_create();
	obs_data_set_string(request, "vendorName", vendorName);
	obs_data_set_string(request, "requestType", requestType);
	if (requestData) {
		obs_data_set_obj(request, "requestData", requestData);
	}

	obs_websocket_request_response *response = obs_websocket_call_request("CallVendorRequest", request);
	if (!response) {
		return nullptr;
	}

	OBSDataAutoRelease result;
	if (response->response_data) {
		OBSDataAutoRelease all = obs_data_create_from_json(response->response_data);
		if (all) {
			result = obs_data_get_obj(all, "responseData");
		}
	}
	obs_websocket_request_response_free(response);
	return result;
}

OBSDataAutoRelease CallKeyer(const char *requestType, int channel, const char *scene)
{
	OBSDataAutoRelease data = obs_data_create();
	obs_data_set_string(data, "dsk_name", std::to_string(channel).c_str());
	if (scene) {
		obs_data_set_string(data, "scene", scene);
	}
	return CallVendor("downstream-keyer", requestType, data);
}

/* Asks the titles of an input (pages of the title gallery) to play their exit. True if there was any. */
bool AskTitlesToLeave(const std::string &sceneName)
{
	OBSSourceAutoRelease source = obs_get_source_by_name(sceneName.c_str());
	obs_scene_t *scene = obs_scene_from_source(source);
	if (!scene) {
		return false;
	}

	std::vector<std::string> titles;
	obs_scene_enum_items(
		scene,
		[](obs_scene_t *, obs_sceneitem_t *item, void *param) {
			obs_source_t *itemSource = obs_sceneitem_get_source(item);
			if (strcmp(obs_source_get_unversioned_id(itemSource), "browser_source") == 0) {
				OBSDataAutoRelease settings = obs_source_get_settings(itemSource);
				if (strstr(obs_data_get_string(settings, "url"), "/gc/")) {
					static_cast<std::vector<std::string> *>(param)->push_back(
						obs_source_get_name(itemSource));
				}
			}
			return true;
		},
		&titles);

	for (const std::string &title : titles) {
		OBSDataAutoRelease eventData = obs_data_create();
		obs_data_set_string(eventData, "name", title.c_str());
		obs_data_set_bool(eventData, "show", false);
		OBSDataAutoRelease data = obs_data_create();
		obs_data_set_string(data, "event_name", "freemix-gc");
		obs_data_set_obj(data, "event_data", eventData);
		CallVendor("obs-browser", "emit_event", data);
	}
	return !titles.empty();
}

class OverlayButtons : public QWidget {
public:
	explicit OverlayButtons(QWidget *parent) : QWidget(parent)
	{
		setObjectName("freemixOverlayButtons");

		QGridLayout *grid = new QGridLayout(this);
		grid->setContentsMargins(0, 1, 0, 0);
		grid->setSpacing(2);

		for (int i = 0; i < kOverlayCount; i++) {
			QPushButton *button = new QPushButton(QString::number(i + 1), this);
			button->setProperty("class", "freemix-overlay");
			button->setCheckable(true);
			button->setFocusPolicy(Qt::NoFocus);
			button->setContextMenuPolicy(Qt::CustomContextMenu);
			button->setMinimumWidth(0);
			button->setFixedHeight(22);
			grid->addWidget(button, i / 4, i % 4);
			buttons[i] = button;

			connect(button, &QPushButton::clicked, this, [this, i]() { Toggle(i); });
			connect(button, &QWidget::customContextMenuRequested, this,
				[this, i](const QPoint &pos) { ShowMenu(i, buttons[i]->mapToGlobal(pos)); });
		}

		QTimer *timer = new QTimer(this);
		connect(timer, &QTimer::timeout, this, [this]() { Refresh(); });
		timer->start(500);
		Refresh();
	}

private:
	std::array<QPushButton *, kOverlayCount> buttons{};
	std::array<std::string, kOverlayCount> scenes;
	std::array<bool, kOverlayCount> present{};

	/* Which keyers exist changes rarely and is the expensive question: asked every few refreshes. */
	int refreshesUntilPresence = 0;

	void RefreshPresence()
	{
		present.fill(false);

		OBSDataAutoRelease answer = CallVendor("downstream-keyer", "get_downstream_keyers", nullptr);
		OBSDataArrayAutoRelease keyers = answer ? obs_data_get_array(answer, "downstream_keyers") : nullptr;
		const size_t count = keyers ? obs_data_array_count(keyers) : 0;
		for (size_t k = 0; k < count; k++) {
			OBSDataAutoRelease keyer = obs_data_array_item(keyers, k);
			const std::string name = obs_data_get_string(keyer, "name");
			for (int i = 0; i < kOverlayCount; i++) {
				if (name == std::to_string(i + 1)) {
					present[i] = true;
				}
			}
		}
	}

	void Refresh()
	{
		const bool allPresent = std::all_of(present.begin(), present.end(), [](bool value) { return value; });
		if (!allPresent || refreshesUntilPresence-- <= 0) {
			RefreshPresence();
			refreshesUntilPresence = 10;
		}

		/* What a keyer shows is asked with dsk_get_scene: the "scene" field of the list above is the list's
		 * cursor, which a keyer switched by request does not move. */
		for (int i = 0; i < kOverlayCount; i++) {
			scenes[i].clear();
			if (present[i]) {
				OBSDataAutoRelease answer = CallKeyer("dsk_get_scene", i + 1, nullptr);
				if (answer) {
					scenes[i] = obs_data_get_string(answer, "scene");
				}
			}
		}

		for (int i = 0; i < kOverlayCount; i++) {
			QPushButton *button = buttons[i];
			const bool onAir = !scenes[i].empty();
			button->setEnabled(present[i]);
			button->setChecked(onAir);

			const QString number = QString::number(i + 1);
			if (!present[i]) {
				button->setToolTip(QTStr("FreeMix.Overlay.Missing").arg(number));
			} else if (onAir) {
				button->setToolTip(QTStr("FreeMix.Overlay.OnAir").arg(number, QString::fromStdString(scenes[i])));
			} else {
				button->setToolTip(QTStr("FreeMix.Overlay.Toggle").arg(number));
			}
		}
	}

	void TakeOff(int index)
	{
		const std::string scene = scenes[index];
		if (scene.empty()) {
			return;
		}

		QPointer<OverlayButtons> self(this);
		auto cut = [self, index]() {
			CallKeyer("dsk_select_scene", index + 1, "");
			if (self) {
				self->Refresh();
			}
		};

		if (AskTitlesToLeave(scene)) {
			QTimer::singleShot(kTitleExitMs, qApp, cut);
		} else {
			cut();
		}
	}

	void Toggle(int index)
	{
		Refresh();

		OBSSourceAutoRelease preview = obs_frontend_get_current_preview_scene();
		const std::string previewName = preview ? obs_source_get_name(preview) : "";

		if (!present[index] || previewName.empty()) {
			Refresh();
			return;
		}

		if (scenes[index] == previewName) {
			TakeOff(index);
			return;
		}

		/* The keyer only shows inputs of its own list: put the input on the list, then on air. */
		CallKeyer("dsk_add_scene", index + 1, previewName.c_str());
		QPointer<OverlayButtons> self(this);
		QTimer::singleShot(80, qApp, [self, index, previewName]() {
			CallKeyer("dsk_select_scene", index + 1, previewName.c_str());
			if (self) {
				self->Refresh();
			}
		});
	}

	void ShowMenu(int index, const QPoint &globalPos)
	{
		Refresh();
		if (!present[index]) {
			return;
		}

		const QString number = QString::number(index + 1);
		QMenu menu(this);
		QAction *title = menu.addAction(scenes[index].empty() ? QTStr("FreeMix.Overlay.Empty").arg(number)
								      : QTStr("FreeMix.Overlay.OnAir").arg(
										number, QString::fromStdString(scenes[index])));
		title->setEnabled(false);
		menu.addSeparator();
		QAction *off = menu.addAction(QTStr("FreeMix.Overlay.Off").arg(number));
		off->setEnabled(!scenes[index].empty());
		connect(off, &QAction::triggered, this, [this, index]() { TakeOff(index); });
		menu.exec(globalPos);
	}
};

/* -------------------------------------------------------------------------- */

constexpr float kMeterFloorDb = -60.0f;
constexpr int kMeterChannels = 2;

class MasterMeter : public QWidget {
public:
	explicit MasterMeter(QWidget *parent) : QWidget(parent)
	{
		setObjectName("freemixMasterMeter");
		setFixedWidth(16);
		setMinimumHeight(40);
		/* Takes the height of the row it is in without asking for more: a widget that wants to expand here
		 * makes the main window give the Preview/Output area the room of the docks below when it is restored. */
		setSizePolicy(QSizePolicy::Fixed, QSizePolicy::Preferred);
		setToolTip(QTStr("FreeMix.Meter.ToolTip"));

		for (auto &value : peak) {
			value.store(0.0f);
		}

		obs_add_raw_audio_callback(0, nullptr, AudioCallback, this);

		QTimer *timer = new QTimer(this);
		connect(timer, &QTimer::timeout, this, [this]() { Tick(); });
		timer->start(33);

		onScreen = this;
	}

	~MasterMeter() override
	{
		obs_remove_raw_audio_callback(0, AudioCallback, this);
		if (onScreen == this) {
			onScreen = nullptr;
		}
	}

	/* The meter on screen, if any. Interface thread only. */
	static inline MasterMeter *onScreen = nullptr;

	float Shown(int channel) const { return shown[channel]; }

protected:
	void paintEvent(QPaintEvent *) override
	{
		QPainter painter(this);
		painter.fillRect(rect(), QColor(0x0f, 0x13, 0x18));

		const int gap = 2;
		const int barWidth = (width() - gap * (kMeterChannels + 1)) / kMeterChannels;
		const int top = gap;
		const int full = height() - gap * 2;

		/* Colour changes at the levels the engine's own meters use: yellow from -20 dB, red from -9 dB. */
		const int yellowFrom = full - int(Fraction(-20.0f) * float(full));
		const int redFrom = full - int(Fraction(-9.0f) * float(full));

		for (int channel = 0; channel < kMeterChannels; channel++) {
			const int x = gap + channel * (barWidth + gap);
			painter.fillRect(x, top, barWidth, full, QColor(0x1c, 0x22, 0x2a));

			const int level = int(Fraction(shown[channel]) * float(full));
			if (level > 0) {
				const int start = full - level;
				DrawSpan(painter, x, barWidth, top, start, redFrom, QColor(0xd9, 0x24, 0x18));
				DrawSpan(painter, x, barWidth, top, std::max(start, redFrom), yellowFrom,
					 QColor(0xe6, 0xc2, 0x29));
				DrawSpan(painter, x, barWidth, top, std::max(start, yellowFrom), full,
					 QColor(0x12, 0xa3, 0x1a));
			}

			const int holdY = top + full - int(Fraction(held[channel]) * float(full));
			if (held[channel] > kMeterFloorDb) {
				painter.fillRect(x, std::min(holdY, top + full - 1), barWidth, 1, QColor(0xff, 0xff, 0xff));
			}
		}
	}

private:
	/* Highest sample since the last tick, written by the audio thread. */
	std::array<std::atomic<float>, kMeterChannels> peak;
	std::array<float, kMeterChannels> shown{kMeterFloorDb, kMeterFloorDb};
	std::array<float, kMeterChannels> held{kMeterFloorDb, kMeterFloorDb};
	std::array<int, kMeterChannels> holdTicks{};

	static float Fraction(float db) { return std::clamp((db - kMeterFloorDb) / -kMeterFloorDb, 0.0f, 1.0f); }

	static void DrawSpan(QPainter &painter, int x, int width, int top, int from, int to, const QColor &color)
	{
		if (to > from) {
			painter.fillRect(x, top + from, width, to - from, color);
		}
	}

	static void AudioCallback(void *param, size_t, struct audio_data *data)
	{
		MasterMeter *meter = static_cast<MasterMeter *>(param);

		for (int channel = 0; channel < kMeterChannels; channel++) {
			/* A mono mix has one plane: it is shown on both bars. */
			const float *samples = reinterpret_cast<const float *>(data->data[channel] ? data->data[channel]
												  : data->data[0]);
			if (!samples) {
				continue;
			}

			float highest = 0.0f;
			for (uint32_t i = 0; i < data->frames; i++) {
				highest = std::max(highest, std::fabs(samples[i]));
			}

			float current = meter->peak[channel].load(std::memory_order_relaxed);
			while (highest > current &&
			       !meter->peak[channel].compare_exchange_weak(current, highest, std::memory_order_relaxed)) {
			}
		}
	}

	void Tick()
	{
		bool changed = false;

		for (int channel = 0; channel < kMeterChannels; channel++) {
			const float linear = peak[channel].exchange(0.0f, std::memory_order_relaxed);
			const float db = linear > 0.0f ? std::max(20.0f * std::log10(linear), kMeterFloorDb) : kMeterFloorDb;

			/* Rises at once, falls 40 dB per second. */
			const float next = std::max(db, shown[channel] - 40.0f * 0.033f);
			if (next != shown[channel]) {
				shown[channel] = std::max(next, kMeterFloorDb);
				changed = true;
			}

			/* The peak mark stays for one second. */
			if (db > held[channel]) {
				held[channel] = db;
				holdTicks[channel] = 30;
				changed = true;
			} else if (holdTicks[channel] > 0 && --holdTicks[channel] == 0) {
				held[channel] = shown[channel];
				changed = true;
			}
		}

		if (changed) {
			update();
		}
	}
};

} // namespace

QWidget *FreeMixCreateOverlayButtons(QWidget *parent)
{
	return new OverlayButtons(parent);
}

QWidget *FreeMixCreateMasterMeter(QWidget *parent)
{
	return new MasterMeter(parent);
}

QWidget *FreeMixCreateClocks(QWidget *parent)
{
#ifdef BROWSER_AVAILABLE
	if (cef) {
		QUrl url = QUrl::fromLocalFile(QDir(QCoreApplication::applicationDirPath()).absoluteFilePath("../../painel/topbar.html"));
		url.setQuery("mode=clocks");
		QCefWidget *clocks = cef->create_widget(parent, url.toString().toUtf8().constData(), nullptr);
		if (clocks) { clocks->setObjectName("freemixProductionClocks"); clocks->setFixedHeight(122); return clocks; }
	}
#endif
	auto *clock = new QLabel(parent);
	clock->setObjectName("freemixProductionClocks");
	clock->setAlignment(Qt::AlignCenter);
	clock->setFixedHeight(40);
	auto *timer = new QTimer(clock);
	QObject::connect(timer, &QTimer::timeout, clock, [clock]() { clock->setText(QDateTime::currentDateTime().toString("HH:mm:ss")); });
	timer->start(1000);
	return clock;
}

bool FreeMixMasterLevel(float &leftDb, float &rightDb)
{
	if (!MasterMeter::onScreen) {
		return false;
	}
	leftDb = MasterMeter::onScreen->Shown(0);
	rightDb = MasterMeter::onScreen->Shown(1);
	return true;
}
