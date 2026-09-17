# Brand assets

- `coop-lab-mobile.webp`: Separate square hero illustration for viewports up to 800px. One compact station keeps the humanoid, robot arm, and calibration board legible on a phone. Created through the fallback imagegen CLI and OpenAI Image API (`gpt-image-2`, edits endpoint, high quality, 1024 × 1024), using the desktop illustration as the visual reference. The [exact mobile prompt](design/lab-mobile-illustration-prompt.txt) was passed with `--no-augment`. The source is saved locally at `output/imagegen/coop-lab-mobile.png`; the [optimized website asset](public/images/coop-lab-mobile.webp) is 189 KB. Native `<picture>` source selection loads this image on smaller screens and retains the original desktop panorama on larger screens.

- `coop-lab-panorama-v2.webp`: The active desktop hero illustration, rearranged with the calibration target in the center and the humanoid on the right. Created through the fallback imagegen CLI and OpenAI Image API (`gpt-image-2`, edits endpoint, high quality, 2048 × 1152), using the original panorama as the edit target. The [exact recomposition prompt](design/lab-panorama-recomposition-prompt.txt) was passed with `--no-augment`. The source is saved locally at `output/imagegen/coop-lab-panorama-v2.png`; the [optimized website asset](public/images/coop-lab-panorama-v2.webp) is stored in the project.

- `coop-lab-panorama.webp`: Original AI-generated architectural illustration, created with the OpenAI Image API (`gpt-image-2`, generation mode, 2048 × 1152, high quality) and optimized to WebP. The site identifies it as concept artwork. The [complete generation prompt](design/lab-illustration-prompt.md) is preserved for future revisions. The unoptimized source is saved locally at `output/imagegen/coop-lab-panorama.png` and excluded from source control and deployment.

- `humanoid-lab-hero.png`: The existing concept illustration is preserved as an original asset.

- `coop-logo.png`: User-supplied `coop-logo-transparent-navy.png`. Transparent outer padding trimmed; artwork resized without recoloring.
- Favicon and Apple icon: User-supplied `coop-favicon-white-navy.png`, resized for browser use.
- `nvidia-inception-black.png`: Existing black NVIDIA Inception Program lockup from https://www.volograms.com/news/nvidia-inception-program. Original image: https://cdn.prod.website-files.com/602abee77976800cf653442f/613d1ea27ef360401d8aaf37_nvidia.jpg. Outer whitespace cropped, with four pixels of padding retained. White background converted to transparency; black artwork preserved without redrawing.
- NVIDIA program reference: https://www.nvidia.com/en-us/startups/

- `a16z-speedrun.png`: Existing supplied a16z image, cropped to the a16z Speedrun wordmark. The gray background residue has been removed from the alpha channel. “Backed by” is rendered as website text.

# Typography

- Newsreader: upright variable display face from the [Google Fonts source repository](https://github.com/google/fonts/tree/main/ofl/newsreader), self-hosted as `public/fonts/newsreader-latin.woff2`.
- Manrope: variable body face from the [Google Fonts source repository](https://github.com/google/fonts/tree/main/ofl/manrope), self-hosted as `public/fonts/manrope-latin.woff2`.
- Both fonts are Latin subsets with common punctuation and symbols. Their SIL Open Font License files are included beside the fonts. No third-party font requests are made at runtime.

# Benchmark illustrations

The active evaluation selector uses humanoid versions of the three benchmark illustrations. They were edited through the approved fallback imagegen CLI and OpenAI Image API (`gpt-image-2`, edits endpoint, high quality, 1024 × 1024). Each original benchmark image was the edit target, and `coop-lab-mobile.webp` supplied the humanoid design reference. The edits preserve the existing tasks, composition, architectural pencil drawing, ivory paper, and muted watercolor palette. Each prompt was passed unchanged with `--no-augment`.

| Evaluation         | Website asset                                                                                    | Exact edit prompt                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Policy comparison  | [coop-benchmark-comparison-humanoid.webp](public/images/coop-benchmark-comparison-humanoid.webp) | [Comparison humanoid prompt](design/benchmark-comparison-humanoid-prompt.txt) |
| Robustness         | [coop-benchmark-robustness-humanoid.webp](public/images/coop-benchmark-robustness-humanoid.webp) | [Robustness humanoid prompt](design/benchmark-robustness-humanoid-prompt.txt) |
| Regression testing | [coop-benchmark-regression-humanoid.webp](public/images/coop-benchmark-regression-humanoid.webp) | [Regression humanoid prompt](design/benchmark-regression-humanoid-prompt.txt) |

The original edits are saved locally as `output/imagegen/coop-benchmark-{comparison,robustness,regression}-humanoid.png`. The website uses optimized WebP copies with humanoid-specific alt text. The regression illustration also replaces the robots inside both monitor recordings. All are concept illustrations of evaluation scenarios, not facility photographs or published benchmark results.

# Original robot-arm benchmark illustrations

The preceding versions were created through the approved fallback imagegen CLI and OpenAI Image API (`gpt-image-2`, edits endpoint, high quality, 1024 × 1024). The previous `coop-experiment-policy.webp` was supplied as a style reference to preserve the architectural pencil drawing, ivory paper, and muted blue watercolor palette. Each prompt was passed unchanged with `--no-augment`.

| Evaluation         | Website asset                                                                  | Exact prompt                                                |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Policy comparison  | [coop-benchmark-comparison.webp](public/images/coop-benchmark-comparison.webp) | [Comparison prompt](design/benchmark-comparison-prompt.txt) |
| Robustness         | [coop-benchmark-robustness.webp](public/images/coop-benchmark-robustness.webp) | [Robustness prompt](design/benchmark-robustness-prompt.txt) |
| Regression testing | [coop-benchmark-regression.webp](public/images/coop-benchmark-regression.webp) | [Regression prompt](design/benchmark-regression-prompt.txt) |

The original PNGs are saved locally as `output/imagegen/coop-benchmark-{comparison,robustness,regression}.png`. These images and their WebP copies are retained as references; the evaluation selector now uses the humanoid edits above. Existing desktop and mobile hero artwork is retained.

# Previous experiment illustrations

Three original images created through the fallback imagegen CLI and OpenAI Image API (`gpt-image-2`, edits endpoint, high quality, 1024 × 1024). The existing `coop-lab-panorama.webp` was supplied as a style reference for each separate composition. The final prompt files were passed unchanged with `--no-augment`.

| Experiment        | Website asset                                                                | Exact prompt                                             |
| ----------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| Policy evaluation | [coop-experiment-policy.webp](public/images/coop-experiment-policy.webp)     | [Policy prompt](design/experiment-policy-prompt.txt)     |
| Data validation   | [coop-experiment-data.webp](public/images/coop-experiment-data.webp)         | [Data prompt](design/experiment-data-prompt.txt)         |
| Sim-to-real       | [coop-experiment-transfer.webp](public/images/coop-experiment-transfer.webp) | [Transfer prompt](design/experiment-transfer-prompt.txt) |

The originals are saved locally as `output/imagegen/coop-experiment-{policy,data,transfer}.png`. These earlier WebP assets are preserved but no longer used by the evaluation selector. Each is under 170 KB. All three are AI-generated concept illustrations.

# Policy and machine-readable references

- Privacy and cookie notice guidance: https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/cookies-and-privacy-notices-in-detail/
- llms.txt format: https://llmstxt.org/

The policy copy describes this implementation. Confirm operational details, retention, providers, and legal company identity before public deployment.
