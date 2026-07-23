// Editable ad templates. Templates define layout, positions and preferred
// style presets ONLY. They never contain fixed Dhivehi copy — placeholder
// text is used until the user inserts approved copy.

export type TemplateLayer = {
  layerType: string;
  language?: "dv" | "en" | "neutral";
  placeholder: string;
  // Positions are expressed as fractions of the canvas (0..1)
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  fontSizePct: number; // fraction of canvas height
  align?: "left" | "center" | "right";
  presetId?: string;
};

export type AdTemplate = {
  id: string;
  label: string;
  industry: string;
  logoPosition: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "top_center";
  safeMarginPct: number;
  layers: TemplateLayer[];
};

const H = (over: Partial<TemplateLayer>): TemplateLayer => ({
  layerType: "dv_headline",
  language: "dv",
  placeholder: "ސުރުޚީ",
  xPct: 0.08,
  yPct: 0.1,
  widthPct: 0.84,
  heightPct: 0.18,
  fontSizePct: 0.07,
  align: "right",
  ...over,
});

export const AD_TEMPLATES: AdTemplate[] = [
  {
    id: "restaurant_offer",
    label: "Restaurant Offer",
    industry: "restaurant",
    logoPosition: "top_left",
    safeMarginPct: 0.06,
    layers: [
      H({ yPct: 0.12, placeholder: "ޚާއްޞަ އޮފަރ", presetId: "bold_sale" }),
      H({ layerType: "dv_subheadline", placeholder: "ރެސްޓޯރަންޓް", yPct: 0.32, heightPct: 0.1, fontSizePct: 0.045 }),
      H({ layerType: "price", language: "neutral", placeholder: "MVR 0", yPct: 0.5, heightPct: 0.12, fontSizePct: 0.06, align: "center", presetId: "bold_sale" }),
      H({ layerType: "cta", language: "neutral", placeholder: "ގުޅުއްވާ", yPct: 0.82, heightPct: 0.08, fontSizePct: 0.035, align: "center" }),
      H({ layerType: "phone", language: "neutral", placeholder: "+960 000 0000", yPct: 0.9, heightPct: 0.06, fontSizePct: 0.03, align: "center" }),
    ],
  },
  {
    id: "retail_sale",
    label: "Retail Sale",
    industry: "retail",
    logoPosition: "top_right",
    safeMarginPct: 0.06,
    layers: [
      H({ layerType: "offer", language: "neutral", placeholder: "SALE", yPct: 0.1, heightPct: 0.2, fontSizePct: 0.11, align: "center", presetId: "bold_sale" }),
      H({ placeholder: "ސޭލް", yPct: 0.36, heightPct: 0.12, fontSizePct: 0.05 }),
      H({ layerType: "price", language: "neutral", placeholder: "MVR 0", yPct: 0.6, heightPct: 0.12, fontSizePct: 0.06, align: "center" }),
      H({ layerType: "cta", language: "neutral", placeholder: "ސޭލް ފެށިއްޖެ", yPct: 0.85, heightPct: 0.08, fontSizePct: 0.035, align: "center" }),
    ],
  },
  {
    id: "tourism_package",
    label: "Tourism Package",
    industry: "tourism",
    logoPosition: "top_center",
    safeMarginPct: 0.07,
    layers: [
      H({ placeholder: "ދަތުރު", yPct: 0.55, presetId: "luxury" }),
      H({ layerType: "dv_body", placeholder: "ޕެކޭޖް ތަފްޞީލް", yPct: 0.73, heightPct: 0.1, fontSizePct: 0.03 }),
      H({ layerType: "price", language: "neutral", placeholder: "MVR 0", yPct: 0.85, heightPct: 0.1, fontSizePct: 0.045, align: "center" }),
    ],
  },
  {
    id: "resort_promotion",
    label: "Resort Promotion",
    industry: "tourism",
    logoPosition: "bottom_right",
    safeMarginPct: 0.08,
    layers: [
      H({ placeholder: "ރިޒޯޓް", yPct: 0.6, presetId: "luxury" }),
      H({ layerType: "cta", language: "neutral", placeholder: "ބުކް ކުރައްވާ", yPct: 0.82, heightPct: 0.08, fontSizePct: 0.035, align: "center" }),
    ],
  },
  {
    id: "carpentry",
    label: "Carpentry",
    industry: "carpentry",
    logoPosition: "top_left",
    safeMarginPct: 0.06,
    layers: [
      H({ placeholder: "ފަރުނީޗަރު", yPct: 0.12, presetId: "corporate" }),
      H({ layerType: "dv_body", placeholder: "ޚިދުމަތް", yPct: 0.34, heightPct: 0.12, fontSizePct: 0.032 }),
      H({ layerType: "phone", language: "neutral", placeholder: "+960 000 0000", yPct: 0.88, heightPct: 0.06, fontSizePct: 0.03, align: "center" }),
    ],
  },
  {
    id: "construction",
    label: "Construction",
    industry: "construction",
    logoPosition: "top_left",
    safeMarginPct: 0.06,
    layers: [
      H({ placeholder: "ބިނާކުރުން", yPct: 0.12, presetId: "corporate" }),
      H({ layerType: "cta", language: "neutral", placeholder: "ގުޅުއްވާ", yPct: 0.85, heightPct: 0.08, fontSizePct: 0.035, align: "center" }),
    ],
  },
  {
    id: "real_estate",
    label: "Real Estate",
    industry: "real estate",
    logoPosition: "top_right",
    safeMarginPct: 0.06,
    layers: [
      H({ placeholder: "ގޯތި ވިއްކުމަށް", yPct: 0.12, presetId: "corporate" }),
      H({ layerType: "price", language: "neutral", placeholder: "MVR 0", yPct: 0.5, heightPct: 0.12, fontSizePct: 0.05, align: "center" }),
      H({ layerType: "phone", language: "neutral", placeholder: "+960 000 0000", yPct: 0.88, heightPct: 0.06, fontSizePct: 0.03, align: "center" }),
    ],
  },
  {
    id: "corporate_announcement",
    label: "Corporate Announcement",
    industry: "corporate",
    logoPosition: "top_center",
    safeMarginPct: 0.08,
    layers: [
      H({ placeholder: "އިޢުލާން", yPct: 0.2, align: "center", presetId: "corporate" }),
      H({ layerType: "dv_body", placeholder: "ތަފްޞީލް", yPct: 0.45, heightPct: 0.2, fontSizePct: 0.03, align: "center" }),
    ],
  },
  {
    id: "recruitment",
    label: "Recruitment",
    industry: "recruitment",
    logoPosition: "top_left",
    safeMarginPct: 0.06,
    layers: [
      H({ placeholder: "ވަޒީފާގެ ފުރުޞަތު", yPct: 0.12, presetId: "corporate" }),
      H({ layerType: "dv_body", placeholder: "ތަފްޞީލް", yPct: 0.35, heightPct: 0.25, fontSizePct: 0.028 }),
      H({ layerType: "cta", language: "neutral", placeholder: "އެޕްލައި ކުރައްވާ", yPct: 0.85, heightPct: 0.08, fontSizePct: 0.032, align: "center" }),
    ],
  },
  {
    id: "event",
    label: "Event",
    industry: "event",
    logoPosition: "top_center",
    safeMarginPct: 0.07,
    layers: [
      H({ placeholder: "އިވެންޓް", yPct: 0.15, align: "center", presetId: "modern" }),
      H({ layerType: "date", language: "neutral", placeholder: "00/00/0000", yPct: 0.42, heightPct: 0.08, fontSizePct: 0.035, align: "center" }),
      H({ layerType: "location", language: "neutral", placeholder: "Location", yPct: 0.52, heightPct: 0.08, fontSizePct: 0.03, align: "center" }),
    ],
  },
  {
    id: "product_launch",
    label: "Product Launch",
    industry: "retail",
    logoPosition: "top_right",
    safeMarginPct: 0.06,
    layers: [
      H({ placeholder: "އާ އުފެއްދުން", yPct: 0.12, presetId: "modern" }),
      H({ layerType: "en_subheadline", language: "en", placeholder: "New Arrival", yPct: 0.34, heightPct: 0.08, fontSizePct: 0.035, align: "right" }),
      H({ layerType: "cta", language: "neutral", placeholder: "ބައްލަވާ", yPct: 0.85, heightPct: 0.08, fontSizePct: 0.035, align: "center" }),
    ],
  },
];
