# SmartSpace — AI Interior Design Platform

An intelligent interior design platform that turns room dimensions and photos into functional, furnished spaces. SmartSpace combines real-time color analysis, 2D floor plan rendering, and multi-store product matching to deliver budget-optimized room designs.

🔗 **Live Demo:** https://aseel-aihub.github.io/SmartSpace/

---

### Features

- **Photo & Color Analysis:** Extracts dominant room tones and HSL palettes client-side using the HTML5 Canvas API.
- **Smart Dimension Planning:** Customizes layouts to true centimeter scale for accurate walkway and clearance validation.
- **Multi-Store Matching:** Curates furniture combinations matched to room aesthetic, size, and target budget.
- **Interactive 2D Layout:** Real-time floor plan visualization with direct furniture positioning and fit checking.
- **Itemized Shopping List:** Tracks live pricing totals with direct purchase links.
- **Catalog Management:** Admin console to inspect and manage store inventory feeds.

---

### Tech Stack

- **Frontend:** HTML5, CSS3 (Modern Responsive UI)
- **Engine:** Vanilla JavaScript (ES6+), Canvas API
- **Storage:** Client-Side LocalStorage

---

### Quick Start

No build tools or installation required. Clone the repo and open `index.html` in your browser:

```bash
git clone [https://github.com/aseel-aihub/SmartSpace.git](https://github.com/aseel-aihub/SmartSpace.git)
cd SmartSpace
open index.html

Repository Structure
SmartSpace/
├── index.html              # Main application
├── css/style.css           # Design system and styles
├── js/                     # Application logic, layout & matching engines
└── assets/                 # Icons and image assets
