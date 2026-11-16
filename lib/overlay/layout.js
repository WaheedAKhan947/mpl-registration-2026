// Where the overlay's stacked graphics go, measured from the score bar's edge
// of the canvas (bottom, or top with ?position=top). The portrait score bar
// is stacked and about twice as tall, so everything above it moves up.
// Pure, no imports, so it is unit tested directly.
//   over:   end-of-over summary
//   panel:  operator quick panel (partnership / run rate), at the right
//   card:   lower-third player cards, at the left, above the panel
export function stackOffsets(params) {
  const margin = Math.round((params?.height || 1080) * 0.05);
  const portrait = params?.layout === "portrait";
  const bar = portrait ? 430 : 210;
  return {
    over: margin + bar + 10,
    panel: margin + bar,
    card: margin + bar + (portrait ? 280 : 190),
  };
}

// CSS position for a graphic `offset` px from the score bar's edge.
export function fromBarEdge(params, offset) {
  return params?.position === "top" ? { top: offset } : { bottom: offset };
}
