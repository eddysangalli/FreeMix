// FreeMix original shader for obs-shaderfilter 2.6.0.
// Input: full-range SDR RGB, Fill LEFT / grayscale Key RIGHT in one frame.
// Keep this shader BEFORE a Crop/Pad filter removing the right half.
// Shaderfilter's normal template uses straight RGBA; its render_output.effect
// converts RGB to linear and libobs supplies SRCALPHA composition blending.
float4 mainImage(VertData v_in) : TARGET
{
    if (v_in.uv.x >= 0.5) return float4(0.0, 0.0, 0.0, 0.0);
    float4 fill = image.Sample(textureSampler, v_in.uv);
    float key = saturate(image.Sample(textureSampler, v_in.uv + float2(0.5, 0.0)).r);
    return float4(fill.rgb, key);
}
