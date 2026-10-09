#define NOMINMAX
#include <DeckLinkAPI.h>
#include "../../freemix-app/plugins/decklink/FreeMixDecklinkHdrContract.hpp"
#include <cassert>
#include <chrono>
#include <iostream>
#include <limits>
#include <set>
#include <vector>
using namespace freemix_decklink_hdr;
static_assert(bmdFormat10BitRGBXLE==0x5231306c);
static_assert(bmdFrameContainsHDRMetadata==(1<<1));
struct MockOutput {
 std::vector<std::string> calls;
 HRESULT SetScheduledFrameCompletionCallback(IDeckLinkVideoOutputCallback*){calls.push_back("detach");return S_OK;}
 HRESULT StopScheduledPlayback(BMDTimeValue,BMDTimeValue*,BMDTimeScale){calls.push_back("stop");return S_OK;}
 HRESULT DisableAudioOutput(){calls.push_back("audio");return S_OK;}
 HRESULT DisableVideoOutput(){calls.push_back("video");return S_OK;}
};
int main() {
 assert(AudioStreamTime(1000000000ULL,1000000000ULL,3,1001,30000)==4804);
 assert(AudioStreamTime(2000000000ULL,1000000000ULL,3,1001,30000)==52804);
 assert(AudioStreamTime(1001000000ULL,1000000000ULL,3,1001,30000)==4852);
 assert(AudioStreamTime(0,1,3,1001,30000)==-1);
 assert(AudioStreamTime(1,0,3,1001,0)==-1);
 for(int acquired=0;acquired<=4;acquired++){MockOutput mock;{StartupRollback<MockOutput> guard(&mock);guard.video=acquired>=1;guard.audio=acquired>=2;guard.callback=acquired>=3;guard.playbackAttempted=acquired>=4;}assert(mock.calls.size()==size_t(acquired));if(acquired==4)assert((mock.calls==std::vector<std::string>{"detach","stop","audio","video"}));}
 {MockOutput mock;{StartupRollback<MockOutput> guard(&mock);guard.video=guard.audio=guard.callback=guard.playbackAttempted=guard.committed=true;}assert(mock.calls.empty());}
 Metadata m;m.transfer=Transfer::Pq;m.confirmed=true;m.maxMastering=1000;m.minMastering=.0001;m.maxContent=1000;m.maxAverage=400;
 assert(Validate(m).empty());m.transfer=Transfer::Hlg;assert(Validate(m).empty());
 auto invalid=m;invalid.confirmed=false;assert(!Validate(invalid).empty());invalid=m;invalid.whiteY=std::numeric_limits<double>::quiet_NaN();assert(!Validate(invalid).empty());invalid=m;invalid.maxAverage=1001;assert(!Validate(invalid).empty());
 Capabilities caps={true,true,true,true,true,true,true,true};
 assert(Preflight(m,caps,true,false,0).empty());assert(!Preflight(m,caps,false,false,0).empty());assert(!Preflight(m,caps,true,true,0).empty());assert(!Preflight(m,caps,true,false,1).empty());
 for(auto member:{&Capabilities::hdrMetadata,&Capabilities::colorspaceMetadata,&Capabilities::hlg,&Capabilities::rec2020Mode,&Capabilities::tenBitRgbMode,&Capabilities::exactMode,&Capabilities::sdiConnection}){auto c=caps;c.*member=false;assert(!Preflight(m,c,true,false,0).empty());}
 assert(RowBytes(1)==256&&RowBytes(64)==256&&RowBytes(65)==512&&RowBytes(1920)==7680);
 const size_t width=877,height=2,stride=RowBytes(width);std::vector<uint16_t> y(width*height),uv(width*height*2,32768);std::vector<uint8_t> dest(stride*height+16,0xaa);
 for(size_t row=0;row<height;row++)for(size_t x=0;x<width;x++)y[row*width+x]=uint16_t(std::lround(4096.+double(x)*56064./876.));
 assert(ConvertP416((uint8_t*)y.data(),(uint8_t*)uv.data(),width*2,width*4,dest.data(),stride,width,height));
 std::set<uint16_t> levels;
 for(size_t row=0;row<height;row++)for(size_t x=0;x<width;x++){uint32_t word;std::memcpy(&word,dest.data()+row*stride+x*4,4);assert((word&3)==0);const auto r=uint16_t(word>>22),g=uint16_t((word>>12)&1023),b=uint16_t((word>>2)&1023);assert(r==x+64&&r==g&&r==b);levels.insert(r);}
 assert(levels.size()==877);
 // Independent scalar reference catches UV lane-order and RGB bit placement.
 for(size_t i=0;i<y.size();i++){y[i]=uint16_t(4096+(i*7919)%56065);uv[i*2]=uint16_t(4096+(i*3571)%57345);uv[i*2+1]=uint16_t(4096+(i*2377)%57345);}
 assert(ConvertP416((uint8_t*)y.data(),(uint8_t*)uv.data(),width*2,width*4,dest.data(),stride,width,height));
 int maxColorCodeError=0;
 for(size_t row=0;row<height;row++)for(size_t x=0;x<width;x++){
  const size_t i=row*width+x;const double yy=(double(y[i])-4096.)/56064.,cb=(double(uv[i*2])-32768.)/57344.,cr=(double(uv[i*2+1])-32768.)/57344.;
  const double r=yy+1.4746*cr,b=yy+1.8814*cb,g=(yy-.2627*r-.0593*b)/.678;
  const uint32_t expected=Pack(r,g,b);uint32_t actual;std::memcpy(&actual,dest.data()+row*stride+x*4,4);
  for(int shift:{2,12,22})maxColorCodeError=std::max(maxColorCodeError,std::abs(int((expected>>shift)&1023)-int((actual>>shift)&1023)));
 }
 assert(maxColorCodeError<=1);
 for(size_t row=0;row<height;row++)for(size_t x=width*4;x<stride;x++)assert(dest[row*stride+x]==0);
 for(size_t x=stride*height;x<dest.size();x++)assert(dest[x]==0xaa);
 assert(!ConvertP416((uint8_t*)y.data(),(uint8_t*)uv.data(),width*2-1,width*4,dest.data(),stride,width,height));
 assert(!ConvertP416((uint8_t*)y.data(),(uint8_t*)uv.data(),width*2,width*4,dest.data(),width*4,width,height));
 assert(Pack(1.,0.,0.)==(uint32_t(940)<<22|uint32_t(64)<<12|uint32_t(64)<<2));
 const size_t bw=1920,bh=1080;std::vector<uint16_t> by(bw*bh,32768),buv(bw*bh*2,32768);std::vector<uint8_t> bout(RowBytes(bw)*bh);const auto begin=std::chrono::steady_clock::now();for(int i=0;i<30;i++)assert(ConvertP416((uint8_t*)by.data(),(uint8_t*)buv.data(),bw*2,bw*4,bout.data(),RowBytes(bw),bw,bh));const double ms=std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-begin).count()/30.;
 std::cout<<"{\"convert1080pMeanMs\":"<<ms<<",\"maxColorCodeError\":"<<maxColorCodeError<<",\"status\":\"PASS\",\"sdkHeadersReal\":true,\"uniqueLimited10bitLevels\":"<<levels.size()<<",\"hardware\":false,\"driver\":\"mock capabilities\",\"pixelFormat\":\"R10l limited64..940 aligned256\"}\n";
}
