/* Hazard perception explainer. The real DVSA test uses video clips, which
   this app can't reproduce — so instead this builds the same underlying
   skill (scanning ahead, reading developing situations) through worked
   diagram examples and technique notes. Content is static; this module
   just renders it once and keeps focus handling consistent with the
   other Theory Test Prep sub-tabs. */

(function () {
  "use strict";

  var root = null;

  var STREET_SVG =
    '<svg class="hazard-svg" viewBox="0 0 400 200" role="img" aria-labelledby="hazard-svg1-title hazard-svg1-desc">' +
      '<title id="hazard-svg1-title">A residential street with parked cars</title>' +
      '<desc id="hazard-svg1-desc">Parked cars line the left kerb with a gap between two of them. A ball sits near the gap. A car further down the road shows its brake lights.</desc>' +
      '<rect class="hazard-svg__sky" x="0" y="0" width="400" height="200"/>' +
      '<rect class="hazard-svg__pavement" x="0" y="70" width="400" height="30"/>' +
      '<rect class="hazard-svg__road" x="0" y="100" width="400" height="100"/>' +
      '<line class="hazard-svg__roadline" x1="0" y1="150" x2="400" y2="150"/>' +
      // parked car 1
      '<g><rect class="hazard-svg__car" x="20" y="95" width="55" height="26" rx="4"/><circle class="hazard-svg__wheel" cx="34" cy="121" r="6"/><circle class="hazard-svg__wheel" cx="64" cy="121" r="6"/></g>' +
      // parked car 2
      '<g><rect class="hazard-svg__car" x="90" y="95" width="55" height="26" rx="4"/><circle class="hazard-svg__wheel" cx="104" cy="121" r="6"/><circle class="hazard-svg__wheel" cx="134" cy="121" r="6"/></g>' +
      // gap, with ball
      '<circle class="hazard-svg__ball" cx="178" cy="118" r="7"/>' +
      // parked car 3 (after gap)
      '<g><rect class="hazard-svg__car" x="215" y="95" width="55" height="26" rx="4"/><circle class="hazard-svg__wheel" cx="229" cy="121" r="6"/><circle class="hazard-svg__wheel" cx="259" cy="121" r="6"/></g>' +
      // lead car further ahead with brake lights
      '<g><rect class="hazard-svg__car hazard-svg__car--lead" x="320" y="100" width="40" height="20" rx="3"/><rect class="hazard-svg__brakelight" x="317" y="104" width="4" height="10"/><circle class="hazard-svg__wheel" cx="330" cy="120" r="5"/><circle class="hazard-svg__wheel" cx="352" cy="120" r="5"/></g>' +
      // callout markers
      '<g class="hazard-svg__marker" transform="translate(178,80)"><circle r="11"/><text y="4">1</text></g>' +
      '<g class="hazard-svg__marker" transform="translate(178,140)"><circle r="11"/><text y="4">2</text></g>' +
      '<g class="hazard-svg__marker" transform="translate(340,80)"><circle r="11"/><text y="4">3</text></g>' +
    '</svg>';

  var JUNCTION_SVG =
    '<svg class="hazard-svg" viewBox="0 0 400 220" role="img" aria-labelledby="hazard-svg2-title hazard-svg2-desc">' +
      '<title id="hazard-svg2-title">A side junction with a car waiting to pull out and a cyclist approaching</title>' +
      '<desc id="hazard-svg2-desc">You are travelling along a main road. A car waits at a give-way line on a side road to your left, its front just visible. A cyclist is on the main road ahead of you, closer to the junction than the car.</desc>' +
      '<rect class="hazard-svg__sky" x="0" y="0" width="400" height="220"/>' +
      '<rect class="hazard-svg__road" x="0" y="120" width="400" height="70"/>' +
      '<rect class="hazard-svg__road" x="60" y="120" width="70" height="100"/>' +
      '<line class="hazard-svg__roadline hazard-svg__roadline--dashed" x1="0" y1="155" x2="400" y2="155"/>' +
      '<line class="hazard-svg__giveway" x1="130" y1="120" x2="130" y2="188"/>' +
      // waiting car nose, poking out from side road
      '<g><rect class="hazard-svg__car" x="95" y="128" width="40" height="24" rx="4"/><circle class="hazard-svg__wheel" cx="108" cy="152" r="5"/><circle class="hazard-svg__wheel" cx="128" cy="152" r="5"/></g>' +
      // cyclist on main road
      '<g transform="translate(260,150)"><circle class="hazard-svg__wheel" cx="-10" cy="14" r="9"/><circle class="hazard-svg__wheel" cx="16" cy="14" r="9"/><path class="hazard-svg__bikeframe" d="M -10 14 L 4 -4 L 16 14 M 4 -4 L 0 -14 M -6 -14 L 8 -14"/><circle class="hazard-svg__rider" cx="0" cy="-18" r="6"/></g>' +
      // callout markers
      '<g class="hazard-svg__marker" transform="translate(115,110)"><circle r="11"/><text y="4">1</text></g>' +
      '<g class="hazard-svg__marker" transform="translate(266,120)"><circle r="11"/><text y="4">2</text></g>' +
      '<g class="hazard-svg__marker" transform="translate(360,140)"><circle r="11"/><text y="4">3</text></g>' +
    '</svg>';

  var HTML =
    '<h2 tabindex="-1" id="theory-hazard-heading">Hazard Perception</h2>' +

    '<div class="card hazard-intro">' +
      '<p><strong>A quick note on what this section is (and isn\'t):</strong> the real DVSA hazard perception test uses video clips, ' +
      'and a video-based simulation isn\'t something this app can generate. What follows instead is a written and diagram-based guide ' +
      'to the underlying skill the test measures &mdash; spotting a developing situation early and reading the road ahead &mdash; ' +
      'plus what to expect on the day. For actual clip practice, use the official DVSA-endorsed practice materials on ' +
      '<a href="https://www.gov.uk/hazard-perception-test" target="_blank" rel="noopener">gov.uk</a>.</p>' +
    '</div>' +

    '<h3>How the real test works</h3>' +
    '<div class="card">' +
      '<p>You\'re shown a series of video clips filmed from a car\'s point of view, and you click (or tap) as soon as you spot a ' +
      '<strong>developing hazard</strong> &mdash; something that would make a competent driver need to take action, like slow down, ' +
      'change position, or be ready to stop. The earlier you spot it within the scoring window, the higher your mark for that clip; ' +
      'react too late and you may score nothing for it.</p>' +
      '<p>There are usually 14 clips, and one of them typically contains two separate developing hazards rather than one, giving 15 ' +
      'scoring opportunities in total. Each is scored on a sliding scale, and the pass mark has generally been around 44 out of a possible 75 ' +
      '&mdash; but formats and pass marks can change, so always check the current details on gov.uk before your test rather than relying on this figure.</p>' +
      '<p><strong>One important trap:</strong> the system is designed to catch clicking repeatedly or rhythmically throughout a clip to try ' +
      'to "cover" every possible hazard. If it detects this pattern, you can score zero for that clip even if your timing would otherwise ' +
      'have been fine. Watch genuinely, and click when you actually see something developing.</p>' +
    '</div>' +

    '<h3>Developing hazard vs potential hazard</h3>' +
    '<div class="card">' +
      '<p>A <strong>potential hazard</strong> is something in the scene that could turn into a problem but hasn\'t started to yet &mdash; ' +
      'a ball lying still on a pavement, a pedestrian standing at the kerb but not moving, a side road with no visible traffic. Worth ' +
      'noticing, but not yet something you need to react to.</p>' +
      '<p>A <strong>developing hazard</strong> is the same situation once it starts to actually affect your driving &mdash; the ball ' +
      'starts rolling into the road, the pedestrian steps off the kerb, a car noses out of the side road. This is the moment the real ' +
      'test is scoring: not "is there anything here at all", but "has this started to require a response".</p>' +
    '</div>' +

    '<h3>Worked example: a residential street</h3>' +
    '<div class="card hazard-diagram-card">' +
      '<div class="hazard-diagram">' + STREET_SVG + '</div>' +
      '<ol class="hazard-callout-list">' +
        '<li><strong>Gap between parked cars.</strong> Gaps like this are one of the most common places for a pedestrian, especially a ' +
        'child, to step out without warning. Worth covering the brake and easing off before you draw level with it.</li>' +
        '<li><strong>A ball near the gap.</strong> On its own it\'s only a potential hazard. If it starts moving, or if you spot the ' +
        'child likely to follow it, that\'s the point it becomes a developing hazard you need to react to.</li>' +
        '<li><strong>Brake lights on a car further ahead.</strong> Even though it\'s well down the road and not the car right in front ' +
        'of you, this is a clue that something up there is making traffic slow &mdash; start easing off in anticipation rather than ' +
        'waiting for the car directly ahead to react first.</li>' +
      '</ol>' +
    '</div>' +

    '<h3>Worked example: a side junction</h3>' +
    '<div class="card hazard-diagram-card">' +
      '<div class="hazard-diagram">' + JUNCTION_SVG + '</div>' +
      '<ol class="hazard-callout-list">' +
        '<li><strong>A car waiting at the give-way line.</strong> Its front is just visible past the line. It may already be looking ' +
        'for a gap in traffic &mdash; including the gap right where you are &mdash; so don\'t assume it will definitely wait for you.</li>' +
        '<li><strong>A cyclist on your road, closer to the junction than the waiting car.</strong> A driver pulling out might see your ' +
        'car but misjudge the cyclist\'s speed or miss them entirely &mdash; a classic cause of junction collisions. Watch how the ' +
        'situation between the cyclist and the waiting car develops.</li>' +
        '<li><strong>Your own position and speed.</strong> With two things to track at once, easing off slightly and covering the brake ' +
        'gives you time to react to whichever one actually moves, instead of being committed to your current speed.</li>' +
      '</ol>' +
    '</div>' +

    '<h3>Scanning technique</h3>' +
    '<div class="card">' +
      '<ul class="hazard-tips">' +
        '<li>Keep your eyes moving &mdash; near, far, and side to side &mdash; rather than fixing on one point, such as the back of the ' +
        'car in front.</li>' +
        '<li>Look well beyond the vehicle directly ahead of you, towards the next junction, brake lights, or changes in the road layout.</li>' +
        '<li>Check both sides of the road, not just the direction you expect a hazard to come from.</li>' +
        '<li>Pay particular attention around junctions, parked vehicles, bus stops, pedestrian crossings and schools &mdash; the ' +
        'locations where developing hazards are most likely to appear.</li>' +
        '<li>In poor visibility (rain, fog, low sun, darkness), you\'ll see hazards later than usual &mdash; slow down accordingly, ' +
        'because your scanning can\'t make up for reduced visibility on its own.</li>' +
      '</ul>' +
    '</div>' +

    '<h3>Common mistakes</h3>' +
    '<div class="card">' +
      '<ul class="hazard-tips">' +
        '<li>Clicking repeatedly or in a steady rhythm to try to "cover" every possibility &mdash; this is specifically detected and can ' +
        'zero your score for that clip.</li>' +
        '<li>Reacting to the first obvious hazard and missing a second, quieter one developing elsewhere in the same clip.</li>' +
        '<li>Tunnel vision under pressure &mdash; narrowing your attention to directly ahead and missing hazards from the sides.</li>' +
        '<li>Waiting for total certainty before reacting. If a situation is starting to develop, that\'s the moment to respond &mdash; ' +
        'not once it\'s obvious to anyone.</li>' +
      '</ul>' +
      '<p>The <strong>Hazard Awareness</strong> category in <a href="#" class="hazard-link-to-practice">Practice by Category</a> covers ' +
      'the multiple-choice side of this same topic, including how tiredness, alcohol, drugs and illness affect your ability to spot ' +
      'hazards in time.</p>' +
    '</div>';

  function focusHeading() {
    var heading = document.getElementById("theory-hazard-heading");
    if (heading) heading.focus();
  }

  function init() {
    root = document.getElementById("theory-hazard-app");
    if (!root) return;
    root.innerHTML = HTML;

    var practiceLink = root.querySelector(".hazard-link-to-practice");
    if (practiceLink) {
      practiceLink.addEventListener("click", function (evt) {
        evt.preventDefault();
        var subtab = document.getElementById("subtab-theory-practice");
        if (subtab) subtab.click();
      });
    }

    document.addEventListener("tab:activated", function (evt) {
      if (evt.detail && evt.detail.id === "theory-hazard") focusHeading();
    });
  }

  TheoryApp.register(init);
})();
