# Coop lab illustration

Mode: Image API generation through the bundled imagegen CLI, using `gpt-image-2`, high quality, 2048 × 1152. No reference images were supplied. The prompt below was passed with `--no-augment`.

Original output: `output/imagegen/coop-lab-panorama.png` (local, ignored).
Original reference asset: `public/images/coop-lab-panorama.webp`.

The active hero is now `public/images/coop-lab-panorama-v2.webp`, made from this image with the [recomposition prompt](lab-panorama-recomposition-prompt.txt). The original remains the style reference for the experiment illustrations.

## Final prompt

```text
Use case: stylized-concept
Asset type: a panoramic editorial illustration for the hero of Coop, a managed robotics lab website.
Create one sophisticated architectural illustration of a working robotics research laboratory, seen from an elevated three-quarter isometric viewpoint. A single low, broad platform contains three carefully arranged work areas: a stainless steel workbench with two articulated silver robot arms sorting a few terracotta-colored wooden blocks, a generic white humanoid robot performing a manipulation task at a second table, and a camera-equipped testing area with a small calibration board and neatly organized objects. Everything is physically grounded, with plausible joints, grippers, tables, and camera mounts.
The art direction is fine technical pencil and ink drawing combined with restrained, painterly color washes, like a beautifully illustrated science book. Detailed but visually calm, with tactile paper texture and soft daylight. Palette: warm ivory, powder blue, slate blue, navy details, and a few muted terracotta objects. The backdrop is a seamless pale blue-gray studio surface, fading toward warm ivory near the top. Soft blue shadows connect all work areas to the platform.
Composition: wide landscape, the complete laboratory forms one coherent horizontal scene across the lower three quarters of the image, generous breathing room around its edges, no cropped equipment, no floating disconnected objects. A refined, credible laboratory environment rather than a whimsical toy scene. Delicate drawing, realistic proportions, no glossy plastic rendering, no neon, no cinematic darkness.
No text, lettering, logos, labels, watermark, UI, numbers, charts, or people. This is concept artwork, not a photograph of a real facility.
```
