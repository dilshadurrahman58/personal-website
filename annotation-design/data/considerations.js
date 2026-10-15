// data/considerations.js
// The six annotation design considerations, as published in
// Rahman, Lange, Quadri & Rosen, Computer Graphics Forum (EuroVis 2026), doi:10.1111/cgf.70435.
//   name:     the label in Figure 1
//   title:    the heading in Section 4.3
//   takeaway: the TAKEAWAY paragraph that closes each consideration in Section 4.3, verbatim
//   img:      that consideration's panel of Figure 1, cut from the published PDF (tools/make_images.py)
// These are heuristics for reflection, not rules.

window.CONSIDERATIONS = [
  {
    id: "C1",
    n: 1,
    name: "Audience",
    title: "Tailor annotations to audience knowledge and stakes",
    takeaway:
      "Start by specifying the audience and what they must extract from the chart. When redistribution risk is high, embedding essential caveats or context directly on the chart can help. Limit such notes to what is truly necessary, keep them short, and weigh the maintenance cost against the benefit.",
    img: "considerations/web/1-audience",
    size: [1600, 497],
  },
  {
    id: "C2",
    n: 2,
    name: "Hierarchy",
    title: "Create hierarchy among multiple annotations",
    takeaway:
      "Treat multiple annotations as an attention plan anchored in the data. Choose one primary annotation and give it the strongest placement and emphasis so it is read first. Keep remaining annotations consistently secondary through lighter styling and reduced salience. If any secondary annotation competes with the primary or disrupts the reading order, remove, merge, or restyle it.",
    img: "considerations/web/2-hierarchy",
    size: [1600, 497],
  },
  {
    id: "C3",
    n: 3,
    name: "Associate Placement",
    title: "Place annotation text next to data before using connectors or legends",
    takeaway:
      "Annotate the highest-priority targets next to the data. When proximity is not feasible, use short, uncrossed connectors or a single enclosure to preserve unambiguous mapping. Use a key or legend only when distance, interaction, or quantity makes attachment unstable, and order it to match the chart’s reading order.",
    img: "considerations/web/3-associate-placement",
    size: [1600, 510],
  },
  {
    id: "C4",
    n: 4,
    name: "Associate Style",
    title: "Use color and style to associate the label with the data element",
    takeaway:
      "Treat annotation–target association as a deliberate scheme. Use color matching only when categories remain clearly discriminable, and pair it with a non-color cue such as proximity, a connector tick or line, a swatch, or an enclosure. Keep text legible with sufficient contrast, and avoid color-matched text on filled marks when it reduces readability.",
    img: "considerations/web/4-association",
    size: [1600, 510],
  },
  {
    id: "C5",
    n: 5,
    name: "Cohesion",
    title: "Decide whether annotations blend with or stand apart from data",
    takeaway:
      "Decide the role of each annotation before styling it. Use an integrated style when annotations should read as part of the chart; use a distinct style when they should read as added context, but keep it visually subordinate to the data. Reuse both styles consistently across related charts so layers are immediately recognizable and revisions remain manageable.",
    img: "considerations/web/5-cohesion",
    size: [1600, 475],
  },
  {
    id: "C6",
    n: 6,
    name: "Amount",
    title: "Scale annotation count to chart clarity and available space",
    takeaway:
      "Decide an annotation budget for the chart’s intended viewing context. Keep only the annotations that must stay visible to deliver the main claim on first view, and push secondary detail to interaction or surrounding text. Either add annotations until the display feels busy, or start broad and prune, removing, merging, or demoting until scanning remains effortless.",
    img: "considerations/web/6-amount",
    size: [1600, 475],
  },
];
