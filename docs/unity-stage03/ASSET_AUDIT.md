# Unity stage 03 - PNG measurement audit

All 17 imported PNG files are byte-identical copies. Original files remain in public/assets.
Pixel measurements were recalculated from original bytes: PNG signature/CRC, lossless decoding, alpha counts, edge contacts, bounds and luminance differences.

| Asset | Source size | Alpha channel | Semi-transparent pixels | A>=32 bounds (L,T,R,B) | A>=32 source edge contacts | Mean gradient |
|---|---:|---|---:|---|---|---:|
| Architecture layers/breakthrough_platform.png | 941 x 1672 | RGBA | 227956 | [81, 503, 927, 979] | none | 8.237 |
| Architecture layers/front_gate.png | 1213 x 1296 | RGBA | 605062 | [35, 66, 1165, 1126] | none | 7.490 |
| Architecture layers/lanterns_props.png | 941 x 1672 | RGBA | 246032 | [4, 479, 941, 1555] | right:177 | 11.153 |
| Architecture layers/main_courtyard.png | 1148 x 1370 | RGBA | 749995 | [0, 371, 1148, 1311] | right:250, left:299 | 4.395 |
| Architecture layers/temple_left.png | 1040 x 1512 | RGBA | 740497 | [2, 173, 1016, 1340] | none | 6.987 |
| Architecture layers/waterfalls.png | 941 x 1672 | RGBA | 244641 | [358, 657, 908, 1672] | bottom:21 | 4.836 |
| Background layers/bg_cloud_far.png | 941 x 1672 | RGBA | 412139 | [17, 89, 925, 1580] | none | 2.138 |
| Background layers/bg_mountain_far.png | 941 x 1672 | RGBA | 322008 | [0, 267, 941, 709] | right:104, left:155 | 1.893 |
| Background layers/bg_mountain_mid.png | 941 x 1672 | RGBA | 796742 | [0, 270, 941, 1672] | right:494, bottom:311, left:793 | 2.330 |
| Background layers/bg_sky.png | 941 x 1672 | RGB | 0 | [0, 0, 941, 1672] | top:941, right:1672, bottom:941, left:1672 | 0.426 |
| FX layers/formation_ring_base.png | 1254 x 1254 | RGBA | 1249068 | [24, 45, 1225, 1219] | none | 10.477 |
| FX layers/formation_ring_glow.png | 1254 x 1254 | RGBA | 1315053 | [75, 90, 1180, 1159] | none | 6.938 |
| FX layers/light_particles.png | 941 x 1672 | RGBA | 547396 | [65, 116, 889, 1536] | none | 7.620 |
| FX layers/mist_overlay.png | 941 x 1672 | RGBA | 1350787 | [0, 243, 941, 1672] | right:963, bottom:891, left:848 | 0.956 |
| FX layers/petals_overlay.png | 941 x 1671 | RGBA | 184304 | [50, 130, 882, 1583] | none | 2.855 |
| UI/ui_footer.png | 2172 x 724 | RGBA | 502531 | [32, 246, 2140, 465] | none | 3.434 |
| UI/ui_header.png | 2172 x 724 | RGBA | 1224413 | [11, 34, 2165, 681] | none | 10.964 |

Gradient is descriptive, not an automatic sharpness/acceptance score. Smooth skies naturally have lower values.
A>=32 bounds only define content anchors and framing checks. The rendered plane keeps all alpha>0 plus a 3-pixel guard, including soft halos. It does not recolor or remove dark pixels.

All importers: Sprite (2D and UI), Single, FullRect, PPU=100, sRGB, Bilinear, Clamp, no mipmaps, no NPOT resizing, no compression, max size 4096, CPU Read/Write disabled. Architecture planes remain in XY with uniform scale and no perspective tilt.
FullRect is deliberate: soft edges and source alpha are retained. Plane UVs omit only fully transparent outer padding; no Sprite Editor slicing package is required.

The detailed suitability, source defects, placeholders and visual review are documented in ../../docs/UNITY_SECT_SCENE.md.
The numerical JSON includes original/copy SHA-256, pixel counts, alpha bins and crop rectangles.
