// FreeMix: inverse projection of a textured plane. Original implementation.
uniform float rotation_x < string label = "Rotação X"; string widget_type = "slider"; float minimum = -85.0; float maximum = 85.0; float step = 1.0; > = 0.0;
uniform float rotation_y < string label = "Rotação Y"; string widget_type = "slider"; float minimum = -85.0; float maximum = 85.0; float step = 1.0; > = 0.0;
uniform float rotation_z < string label = "Rotação Z"; string widget_type = "slider"; float minimum = -180.0; float maximum = 180.0; float step = 1.0; > = 0.0;
uniform float position_x < string label = "Posição X"; string widget_type = "slider"; float minimum = -2.0; float maximum = 2.0; float step = 0.01; > = 0.0;
uniform float position_y < string label = "Posição Y"; string widget_type = "slider"; float minimum = -2.0; float maximum = 2.0; float step = 0.01; > = 0.0;
uniform float position_z < string label = "Profundidade Z"; string widget_type = "slider"; float minimum = -3.0; float maximum = 0.5; float step = 0.01; > = 0.0;
uniform float scale_x < string label = "Escala X"; string widget_type = "slider"; float minimum = 0.1; float maximum = 3.0; float step = 0.01; > = 1.0;
uniform float scale_y < string label = "Escala Y"; string widget_type = "slider"; float minimum = 0.1; float maximum = 3.0; float step = 0.01; > = 1.0;
uniform float pivot_x < string label = "Pivô X"; string widget_type = "slider"; float minimum = -1.0; float maximum = 1.0; float step = 0.01; > = 0.0;
uniform float pivot_y < string label = "Pivô Y"; string widget_type = "slider"; float minimum = -1.0; float maximum = 1.0; float step = 0.01; > = 0.0;
uniform float field_of_view < string label = "Perspectiva (FOV)"; string widget_type = "slider"; float minimum = 20.0; float maximum = 100.0; float step = 1.0; > = 60.0;
uniform bool orthographic < string label = "Projeção ortográfica"; > = false;
float3 inverse_rotation(float3 p) {
    float3 a = float3(rotation_x, rotation_y, rotation_z) * -0.01745329252;
    float c = cos(a.z), s = sin(a.z);
    p = float3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);
    c = cos(a.y); s = sin(a.y);
    p = float3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
    c = cos(a.x); s = sin(a.x);
    return float3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
}
float4 mainImage(VertData v_in) : TARGET {
    float aspect = uv_size.x / max(uv_size.y, 1.0);
    float2 screen = (v_in.uv - 0.5) * float2(2.0*aspect, -2.0);
    float distance = 1.0 / tan(field_of_view * 0.00872664626);
    float3 pivot = float3(pivot_x*aspect,pivot_y,0.0);
    float3 position = float3(position_x*aspect,position_y,position_z) + pivot;
    float3 origin = orthographic ? float3(screen,distance) : float3(0.0,0.0,distance);
    float3 ray = orthographic ? float3(0.0,0.0,-1.0) : float3(screen,-distance);
    origin = inverse_rotation(origin-position);
    ray = inverse_rotation(ray);
    if (abs(ray.z) < 0.00001) return float4(0.0,0.0,0.0,0.0);
    float hit = -origin.z / ray.z;
    if (hit <= 0.0) return float4(0.0,0.0,0.0,0.0);
    float3 intersection = origin + ray*hit + pivot;
    float2 uv = float2(intersection.x / (2.0*aspect*scale_x)+0.5,0.5-intersection.y/(2.0*scale_y));
    if (any(uv < 0.0) || any(uv > 1.0)) return float4(0.0,0.0,0.0,0.0);
    return image.Sample(textureSampler,uv);
}
