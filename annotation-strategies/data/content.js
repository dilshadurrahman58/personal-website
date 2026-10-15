// data/content.js
// Everything the page says about the paper lives here.
// Strategy text paraphrases Section 5 of the paper. A figure is listed under a strategy
// only when that section of the paper discusses it. Captions are quoted from the paper.
// "notice" lines describe what is visible in each chart image.

window.STRATEGIES = [
  {
    id: "S1",
    headline: "Annotations rarely work alone",
    n: 1,
    section: "5.1",
    name: "Abundant Use of Ensembles",
    short: "Ensembles",
    finding:
      "Professionals rarely rely on a single annotation. They combine several: connectors with text that ties a point of interest to its explanation, color highlighting with text that gives the highlighted area context, a line with text that explains why part of a chart is set apart. Charts with only one annotation were exceedingly rare.",
    implication:
      "Combining annotation types may help clarify complex information and improve overall understanding. The study did not measure how effective ensembles are, but their widespread use by professionals suggests they can make communication more precise.",
    featured: "40_WSJ_BAR",
    // circled marks on the featured chart, as % of the image; each sits beside the annotation it names
    marks: [
      { x: 21.5, y: 27.5, note: "Text explains what happened: the pandemic slump pulled inflation below 2%." },
      { x: 31.5, y: 55, note: "A curved connector ties that text to the exact bar it describes." },
      { x: 53.5, y: 59, note: "A dotted line marks the 2% target, the threshold both callouts refer to." },
    ],
  },
  {
    id: "S2",
    headline: "Highlighting is reserved for the story",
    n: 2,
    section: "5.2",
    name: "Context-Specific Highlighting",
    short: "Highlighting",
    finding:
      "Highlighting appeared consistently, and it was reserved for what the article is about. Most often it took the form of shades of color, or of different shapes, drawing the reader to article-related details in the chart.",
    implication:
      "Color that points to specific areas ties a chart to its article. The study did not test this directly, but its widespread adoption suggests it helps readers take in information and understand the chart.",
    featured: "24_NYT_BAR",
    // circled marks on the featured chart, as % of the image; each sits beside the annotation it names
    marks: [
      { x: 68, y: 26, note: "Violet marks only the proposed cuts, the subject of the article." },
      { x: 24, y: 45, note: "Everything else, including past spending, stays gray." },
    ],
  },
  {
    id: "S3",
    headline: "The article's words move into the chart",
    n: 3,
    section: "5.3",
    name: "Article-Specific Descriptions",
    short: "Article text",
    finding:
      "Designers write key points from the article into the chart as text, either to reinforce the article's main arguments or to emphasize specific points of interest.",
    implication:
      "Descriptions drawn from the article add context and help readers connect the written narrative to the visual one, reinforcing the critical points a chart is meant to convey.",
    featured: "67_ECO_LINE",
    // circled marks on the featured chart, as % of the image; each sits beside the annotation it names
    marks: [
      { x: 10, y: 31.5, note: "The article's first point, written into the chart and pinned to the line with a leader." },
      { x: 46.5, y: 26, note: "Its second point, about middle-aged whites, placed where their trend turns." },
      { x: 60.5, y: 15.5, note: "A label names a single event at its point in time: OxyContin's introduction." },
    ],
  },
  {
    id: "S4",
    headline: "Annotations back up the caption",
    n: 4,
    section: "5.4",
    name: "Relation Between Captions and Annotations",
    short: "Captions",
    finding:
      "In charts with captions, the caption and the annotations were closely related: the annotations supported the general message of the caption. This held across most of the charts examined.",
    implication:
      "Aligning captions with annotations builds a coherent, reinforcing narrative, so that readers can readily grasp the key message a chart carries.",
    featured: "8_WP_BAR",
    // circled marks on the featured chart, as % of the image; each sits beside the annotation it names
    marks: [
      { x: 91.5, y: 2.6, note: "The caption makes the claim: used cars and trucks drove the spike." },
      { x: 53, y: 30, note: "Yellow isolates the inflation that used vehicles added, the part the caption is about." },
      { x: 71, y: 22, note: "Arrows show which way used vehicles moved inflation each month." },
    ],
  },
  {
    id: "S5",
    headline: "Key numbers are written out",
    n: 5,
    section: "5.5",
    name: "Emphasizing Numbers",
    short: "Numbers",
    finding:
      "Charts state article-related numbers explicitly to clarify specific facts and reinforce the article's narrative. Some do so even when a clear axis is available for reading the same values.",
    implication:
      "Writing key values into the chart shows a commitment to numerical clarity, even where reference axes exist, and underscores how those numbers matter to the story.",
    featured: "4_WP_LINE",
    // circled marks on the featured chart, as % of the image; each sits beside the annotation it names
    marks: [
      { x: 16.5, y: 21, note: "The starting value, 8.7 million, is written beside its point, though the axis already marks 5 and 10 million." },
      { x: 66, y: 22, note: "So is the high point before the drop, 9.7 million." },
      { x: 90, y: 21, note: "And the July 2020 value, 8.8 million, set in bold." },
    ],
  },
];

// In the order of the paper's figures
window.FIGURES = [
  {
    id: "40_WSJ_BAR",
    fig: "1a",
    title: "Change in consumer-price index from a year earlier",
    pub: "The Wall Street Journal",
    year: 2021,
    url: "https://www.wsj.com/articles/inflation-rates-fed-11624304034",
    type: "Waterfall chart",
    caption: "A waterfall chart (i.e., a variant of a bar chart) utilizing gray highlights, connectors, and text descriptions.",
    paper: {
      S1: "Connectors, lines and arrows, work with text descriptions to tie points of interest on the chart to the text that explains them.",
      S3: "Part of the article discusses the base effect: the Covid-19 pandemic briefly pushed inflation below a threshold, and it rose the following year. The chart's text descriptions relate directly to that discussion, so readers can connect the chart back to the article.",
      S4: "The caption concerns the change in the consumer-price index from a year earlier, and the annotations show how inflation moved in 2020 and 2021. The gray area emphasizes the target rate, and text with connectors says whether inflation is below or above 2%.",
    },
    notice: [
      "A dotted line marks the 2% target rate, and the band below it is shaded gray.",
      "Two text callouts, each tied to a bar by a curved connector: one on the March 2020 drop below 2%, one on March 2021 prices helping push inflation above 2%.",
      "The last bar carries its value as text, “May 2021, 5.0% annual inflation”, joined to it by a small arrow.",
      "A legend separates months when inflation rose (solid) from months when it fell (hatched).",
    ],
  },
  {
    id: "8_WP_BAR",
    fig: "1b",
    title: "Used cars and trucks drove spring inflation spike",
    pub: "The Washington Post",
    year: 2021,
    url: "https://www.washingtonpost.com/business/2021/10/16/economy-charts-inflation-supply-chain-wages/",
    type: "Bar chart",
    caption: "A bar chart with directional marks, value text, descriptions, and context-specific color highlighting.",
    paper: {
      S1: "Color highlighting emphasizes points of interest, while the accompanying text gives context for the highlighted area of the chart.",
      S4: "The caption says used car and truck prices contributed significantly to this year's rise in inflation. The annotations support that message by explaining the impact of these prices, and arrow-like marks show the changes in the consumer price index.",
    },
    notice: [
      "Yellow segments with upward arrows mark months when used vehicles pushed inflation up; blue-gray segments with downward arrows mark months when they pulled it down.",
      "Every bar is labeled with its monthly change, from 0.3% to 0.9%.",
      "Two text callouts carry the article's claims, and their key words, “added” and “reducing”, are set in the matching segment colors.",
      "“Inflation excluding used vehicles” is written across the gray base of the bars instead of in a legend.",
    ],
  },
  {
    id: "64_ECO_SCATTER",
    fig: "1c",
    title: "The heat is off",
    pub: "The Economist",
    type: "Scatterplot",
    caption: "A scatterplot featuring a trend line and text.",
    paper: {},
    notice: [
      "A dashed trend line runs through the points, labeled “2013-22 trend” on the line itself.",
      "Three points, Dec 2022, Jan 2023, and Feb 2023, are set in a contrasting color and labeled by name. The other points carry no labels.",
      "All three labeled months fall below the trend line.",
    ],
  },
  {
    id: "4_WP_LINE",
    fig: "1d",
    title: "Gas usage for cars and trucks is over 80 percent recovered",
    pub: "The Washington Post",
    type: "Line chart",
    caption: "A line chart with context-specific highlighting and value text.",
    paper: {
      S4: "The caption describes the recovery of gas usage for cars and trucks without naming a timeframe, and the annotations strongly support it. Gray highlighting sets off the area of interest, and the value text makes the changes in consumption evident.",
      S5: "The chart covers January 2019 to July 2020. Although the line has circular marks and an axis on the left, the chart still states explicit values at different points in time.",
    },
    notice: [
      "Gray shading covers March to July 2020, explained in a note below the chart: “The pandemic era is shaded.”",
      "Three values are written beside circular marks on the line: 8.7 million (January 2019), 9.7 million (just before the drop), and 8.8 million (July 2020).",
      "The headline states the article's claim directly: gas usage is over 80 percent recovered.",
    ],
  },
  {
    id: "25_NYT_LINE",
    fig: "1e",
    title: "Fertility rate, India and China",
    pub: "The New York Times",
    type: "Line chart",
    caption: "Another line chart using text descriptions, connectors, enclosures, and context-specific highlighting.",
    paper: {},
    notice: [
      "Gray shading and the label “Projected →” set the projected years apart from the observed ones.",
      "A curved connector ties the statement “India's fertility rate ensures a roughly stable population” to India's line.",
      "A dotted reference line is labeled “Approx. fertility rate for a stable population.”",
      "A bracket encloses the years of China's one-child policy.",
      "India and China are labeled directly on their lines, with no legend.",
    ],
  },
  {
    id: "19_NYT_SCATTER",
    fig: "1f",
    title: "How the new coronavirus compares with other infectious diseases",
    pub: "The New York Times",
    type: "Scatterplot",
    caption: "A scatterplot with context-specific highlighting, data point labels, and a text description.",
    paper: {},
    notice: [
      "A pink rectangle marks the region where the new coronavirus was estimated to fall.",
      "Beside it, a text description gives the bounds: a fatality rate below 3%, and between 2 and 4 transmissions.",
      "Every other disease is labeled at its own point, from bird flu to measles.",
      "Arrows with “More deadly” and “Spreads faster” explain the axes in plain words.",
    ],
  },
  {
    id: "11_WP_LINE",
    fig: "2",
    title: "Hospitalizations and cases break records as the omicron wave continues",
    pub: "The Washington Post",
    year: 2022,
    url: "https://www.washingtonpost.com/health/interactive/2022/omicron-comparison-cases-deaths-hospitalizations/",
    type: "Line chart",
    caption:
      "The figure illustrates a line chart where context-specific gray highlighting is applied, providing visual cues for specific area of interest. Also, descriptive text and connectors are employed as annotation ensembles to enhance the comprehensibility of the chart.",
    paper: {
      S1: "Gray highlighting marks areas of interest, and text descriptions, with connectors in the form of arrows, give details related to the article.",
      S2: "The accompanying article discusses fewer deaths and hospitalizations under the Omicron variant despite a significant increase in cases. Parts of the chart are shaded light gray to draw attention to the peaks of the waves, connecting the article directly to the chart.",
      S3: "Text at the peaks of the pandemic gives information on total cases, deaths, and hospitalizations, which explains how Omicron resulted in comparatively fewer deaths and hospitalizations than previous peaks, given its total number of cases.",
      S5: "The text descriptions name numbers explicitly, such as the 7-day average at the peaks and how they compare, directly supporting the article's storyline.",
    },
    notice: [
      "Light gray bands mark three periods, labeled “Jan. 2021 peak”, “Delta wave”, and “Omicron wave”.",
      "A curved connector ties a callout to the January 2021 peak: a 248,128 7-day average then, and 761,081 cases on Jan. 10, 2022, 307 percent of that peak.",
      "A second callout, with its own connector, notes that deaths and hospitalizations tend to lag behind cases.",
      "The vertical axis is indexed to the January 2021 peak, so each series can be compared on the same scale.",
    ],
  },
  {
    id: "24_NYT_BAR",
    fig: "3",
    title: "Budget Cuts in the G.O.P. Plan",
    pub: "The New York Times",
    year: 2023,
    url: "https://www.nytimes.com/interactive/2023/05/08/upshot/federal-budget-republicans.html",
    type: "Bar chart",
    caption:
      "The figure presents a bar chart in which a dotted line connector and textual elements are utilized to differentiate visual components within the chart. Additionally, colored highlighting is employed to emphasize relevant visual elements corresponding to the focus of the associated article.",
    paper: {
      S1: "A line delineates parts of the bar chart, and the associated text describes the context of the separation.",
      S2: "The article discusses a bill passed by House Republicans to curtail federal spending through caps on discretionary programs, with defense, veterans' health care, Medicare, and Social Security protected from cuts. Violet highlighting shows the amount of reduction in each year, over the ten years starting from 2023.",
    },
    notice: [
      "A dashed vertical line at 2023, labeled “Projected”, separates past spending from the projected years.",
      "Violet segments on the projected bars mark the proposed cuts, labeled “Proposed cuts” inside the highlighted area.",
      "The subtitle states the claim: larger and larger cuts each year, beginning with a 13 percent reduction in 2024.",
    ],
  },
  {
    id: "67_ECO_LINE",
    fig: "4",
    title: "United States, deaths of despair per 100,000 people",
    pub: "The Economist",
    year: 2023,
    url: "https://www.economist.com/graphic-detail/2023/02/27/places-with-high-religious-participation-have-fewer-deaths-of-despair",
    type: "Line chart",
    caption:
      "The figure illustrates a line chart featuring connector-text ensembles that incorporate descriptions of important article-related facts and highlight a specific event at a designated point in time. Gray highlighting is used to convey context-specific information related to the article.",
    paper: {
      S1: "Connectors combined with text descriptions, the same ensemble seen in Figure 1a and Figure 2.",
      S3: "Text descriptions inside the chart explain the deaths of despair per 100,000 people in the United States from 1979 on, complementing the related article.",
    },
    notice: [
      "Two numbered callouts, each with a leader line: “1. Deaths of despair were declining until the opioid epidemic hit” and “2. The downward trend ended earlier among middle-aged whites.”",
      "A vertical line marks a single event, labeled “OxyContin painkiller introduced”.",
      "Dashed arrows extend each series along its pre-1990s trend.",
      "Gray shading fills the gap between the line for whites aged 45 to 64 and their projected trend.",
      "Both series are labeled directly, “Whites aged 45-64” and “All”, with no legend.",
    ],
  },
];

// Section 3 of the paper: the seven annotation types of the design space
window.ANNOTATION_TYPES = [
  { key: "enclosure", name: "Enclosure", text: "Partially or fully closed boundaries, such as ellipses, brackets, and rectangles." },
  { key: "connector", name: "Connector", text: "Lines, solid, dotted, or directional (arrows)." },
  { key: "text", name: "Text", text: "Words or sentences that convey information about the data, usually to add context." },
  { key: "mark", name: "Mark", text: "Symbols or shapes that identify specific objects or categories in the data." },
  { key: "color", name: "Color", text: "Color properties, mostly hue, used to highlight an area of interest or visual elements." },
  { key: "trend", name: "Trend", text: "Trends in the data, such as correlations in scatterplots or changes over time or across categories." },
  { key: "geometric", name: "Geometric", text: "Geometric operations, such as enlarging a segment or a portion of a chart to emphasize it." },
];
