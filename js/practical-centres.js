/* Driving test centre finder: search by town/postcode/name, filter by
   region, card-based results. Region list is derived from the data
   itself, so adding a new region to js/data/testCentres.js is enough —
   nothing here needs to change to pick it up. */

(function () {
  "use strict";

  var root = null;
  var state = { query: "", region: "all" };

  function regionList() {
    var seen = {};
    var regions = [];
    TEST_CENTRES.forEach(function (c) {
      if (!seen[c.region]) { seen[c.region] = true; regions.push(c.region); }
    });
    return regions.sort();
  }

  function normalize(s) {
    return s.toLowerCase().replace(/\s+/g, "");
  }

  function matchesFilter(centre, query, region) {
    if (region !== "all" && centre.region !== region) return false;
    if (!query) return true;
    var q = query.toLowerCase().trim();
    var qTight = normalize(q);
    return centre.name.toLowerCase().indexOf(q) !== -1 ||
      centre.town.toLowerCase().indexOf(q) !== -1 ||
      normalize(centre.postcode).indexOf(qTight) !== -1 ||
      normalize(centre.address).indexOf(qTight) !== -1;
  }

  function featureLabel(tag) {
    return tag.split("-").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }

  function renderResults() {
    var filtered = TEST_CENTRES.filter(function (c) { return matchesFilter(c, state.query, state.region); });

    var countEl = root.querySelector(".centre-results-count");
    if (countEl) countEl.textContent = filtered.length + " centre" + (filtered.length === 1 ? "" : "s") + " found";

    var list = root.querySelector(".centre-results");
    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state card"><p>No centres match your search. Try a different town, postcode, or region.</p></div>';
      return;
    }

    list.innerHTML = '<div class="card-grid">' + filtered.map(function (c) {
      var tagsHtml = c.roadFeatures.map(function (t) {
        return '<span class="badge centre-tag">' + Util.escapeHtml(featureLabel(t)) + '</span>';
      }).join("");
      return (
        '<div class="card centre-card">' +
          '<div class="centre-card__header">' +
            '<h3 class="centre-card__name">' + Util.escapeHtml(c.name) + '</h3>' +
            '<span class="badge centre-card__region">' + Util.escapeHtml(c.region) + '</span>' +
          '</div>' +
          '<p class="centre-card__address">' + Util.escapeHtml(c.address) + '</p>' +
          '<div class="centre-card__tags">' + tagsHtml + '</div>' +
          '<p class="centre-card__notes">' + Util.escapeHtml(c.notes) + '</p>' +
        '</div>'
      );
    }).join("") + '</div>';
  }

  function render(opts) {
    opts = opts || {};
    var regionOptionsHtml = regionList().map(function (r) {
      return '<option value="' + Util.escapeHtml(r) + '">' + Util.escapeHtml(r) + '</option>';
    }).join("");

    root.innerHTML =
      '<h2 tabindex="-1" id="practical-centres-heading">Test Centre Finder</h2>' +
      '<div class="card centre-disclaimer">' +
        '<p><strong>About this data:</strong> centre names and addresses are a small starting sample compiled from public sources, ' +
        'not DVSA&rsquo;s live booking system &mdash; always confirm details and real-time availability on ' +
        '<a href="https://www.gov.uk/find-driving-test-centre" target="_blank" rel="noopener">gov.uk</a> before booking. The road-type ' +
        'notes below are this app&rsquo;s own general impression of each area, not official DVSA routes &mdash; DVSA doesn&rsquo;t ' +
        'publish official test routes, and your actual route depends on the examiner and the day.</p>' +
      '</div>' +
      '<div class="centre-controls">' +
        '<div class="centre-controls__field">' +
          '<label for="centre-search-input">Search by town, postcode or name</label>' +
          '<input type="search" id="centre-search-input" class="centre-search-input" placeholder="e.g. Croydon, or M8">' +
        '</div>' +
        '<div class="centre-controls__field">' +
          '<label for="centre-region-select">Region</label>' +
          '<select id="centre-region-select" class="centre-region-select">' +
            '<option value="all">All regions</option>' + regionOptionsHtml +
          '</select>' +
        '</div>' +
      '</div>' +
      '<p class="centre-results-count" aria-live="polite"></p>' +
      '<div class="centre-results"></div>';

    root.querySelector("#centre-search-input").value = state.query;
    root.querySelector("#centre-region-select").value = state.region;

    root.querySelector("#centre-search-input").addEventListener("input", function (evt) {
      state.query = evt.target.value;
      renderResults();
    });
    root.querySelector("#centre-region-select").addEventListener("change", function (evt) {
      state.region = evt.target.value;
      renderResults();
    });

    renderResults();
    if (opts.focus !== false) focusHeading();
  }

  function focusHeading() {
    var heading = document.getElementById("practical-centres-heading");
    if (heading) heading.focus();
  }

  function init() {
    root = document.getElementById("practical-centres-app");
    if (!root) return;
    render({ focus: false });

    document.addEventListener("tab:activated", function (evt) {
      if (evt.detail && evt.detail.id === "practical-centres") focusHeading();
    });
  }

  PracticalApp.register(init);
})();
