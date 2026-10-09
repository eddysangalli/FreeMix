#define NOMINMAX
#include "../../freemix-app/plugins/decklink/OBSVideoFrame.h"
#include "../../freemix-app/plugins/decklink/decklink-device-instance.hpp"
#include <cassert>
#include <thread>
#include <iostream>
static const GUID forwarded={0x12904822,0x3322,0x4455,{1,2,3,4,5,6,7,8}};
class MockFrame:public OBSVideoFrame {
public:
 MockFrame():OBSVideoFrame(65,2,bmdFormat10BitRGBXLE){}
 HRESULT STDMETHODCALLTYPE QueryInterface(REFIID iid,LPVOID *value) override {if(memcmp(&iid,&forwarded,sizeof iid)==0){*value=static_cast<IDeckLinkMutableVideoFrame*>(this);return S_OK;}return E_NOINTERFACE;}
};
int main(){
 MockFrame native;assert(native.GetRowBytes()==512);
 OBSVideoFrame bgra(64,2,bmdFormat8BitBGRA),v210(64,2,bmdFormat10BitYUV);assert(bgra.GetRowBytes()==256&&v210.GetRowBytes()==256);
 freemix_decklink_hdr::Metadata metadata;metadata.confirmed=true;metadata.maxMastering=1500;metadata.minMastering=.005;metadata.maxContent=1200;metadata.maxAverage=250;
 const std::pair<BMDDeckLinkFrameMetadataID,double> fields[]={
 {bmdDeckLinkFrameMetadataHDRDisplayPrimariesRedX,metadata.redX},{bmdDeckLinkFrameMetadataHDRDisplayPrimariesRedY,metadata.redY},
 {bmdDeckLinkFrameMetadataHDRDisplayPrimariesGreenX,metadata.greenX},{bmdDeckLinkFrameMetadataHDRDisplayPrimariesGreenY,metadata.greenY},
 {bmdDeckLinkFrameMetadataHDRDisplayPrimariesBlueX,metadata.blueX},{bmdDeckLinkFrameMetadataHDRDisplayPrimariesBlueY,metadata.blueY},
 {bmdDeckLinkFrameMetadataHDRWhitePointX,metadata.whiteX},{bmdDeckLinkFrameMetadataHDRWhitePointY,metadata.whiteY},
 {bmdDeckLinkFrameMetadataHDRMaxDisplayMasteringLuminance,1500},{bmdDeckLinkFrameMetadataHDRMinDisplayMasteringLuminance,.005},
 {bmdDeckLinkFrameMetadataHDRMaximumContentLightLevel,1200},{bmdDeckLinkFrameMetadataHDRMaximumFrameAverageLightLevel,250}};
 for(auto transfer:{freemix_decklink_hdr::Transfer::Pq,freemix_decklink_hdr::Transfer::Hlg}){
  metadata.transfer=transfer;auto *frame=new HDRVideoFrame(&native,&metadata);metadata.maxMastering=9999;
  assert(frame->GetFlags()&bmdFrameContainsHDRMetadata);int64_t value=0;assert(frame->GetInt(bmdDeckLinkFrameMetadataHDRElectroOpticalTransferFunc,&value)==S_OK&&value==int64_t(transfer));assert(frame->GetInt(bmdDeckLinkFrameMetadataColorspace,&value)==S_OK&&value==bmdColorspaceRec2020);
  for(auto field:fields){double v=0;assert(frame->GetFloat(field.first,&v)==S_OK&&v==field.second);}
  assert(frame->GetInt(bmdDeckLinkFrameMetadataColorspace,nullptr)==E_INVALIDARG);assert(frame->GetFloat(bmdDeckLinkFrameMetadataHDRWhitePointX,nullptr)==E_INVALIDARG);
  IDeckLinkVideoFrameMetadataExtensions *extension=nullptr;assert(frame->QueryInterface(IID_IDeckLinkVideoFrameMetadataExtensions,(void**)&extension)==S_OK);extension->Release();
  void *forward=nullptr;assert(frame->QueryInterface(forwarded,&forward)==S_OK&&forward==static_cast<IDeckLinkMutableVideoFrame*>(&native));
  assert(frame->Release()==0);metadata.maxMastering=1500;
 }
 FrameQueue queue;uint8_t pixels[3]{};
 for(size_t cycle=0;cycle<100000;cycle++){for(size_t i=0;i<3;i++)assert(queue.push(&pixels[i]));assert(!queue.push(pixels));for(size_t i=0;i<3;i++)assert(queue.pop()==&pixels[i]);assert(!queue.pop());}
 queue.reset();constexpr size_t frames=200000;
 std::thread producer([&]{for(size_t i=0;i<frames;i++){while(!queue.push(&pixels[i%3]))std::this_thread::yield();}});
 for(size_t i=0;i<frames;i++){uint8_t *p=nullptr;while(!(p=queue.pop()))std::this_thread::yield();assert(p==&pixels[i%3]);}producer.join();assert(!queue.pop());
 std::cout<<"{\"result\":\"PASS\",\"sdkHeadersReal\":true,\"hardware\":false,\"metadataFields\":12,\"transfers\":[\"pq\",\"hlg\"],\"metadataCopied\":true,\"ancillaryForwarded\":true,\"queueRecycleCycles\":100000,\"concurrentFrames\":200000,\"queueFullGuard\":true}\n";
}
