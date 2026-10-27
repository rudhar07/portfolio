/**
 * The black side: table tennis.
 *
 * Arrays left empty and fields left null are not rendered. Fill them in with real facts only.
 */

export const player = {
  headline: 'State-level competitive player and multiple-time tournament champion.',

  // TODO: fill in your equipment and style, e.g. { label: 'Grip', value: 'Shakehand' }
  style: [
    // { label: 'Grip', value: '' },
    // { label: 'Style', value: '' },
    // { label: 'Blade', value: '' },
    // { label: 'Forehand', value: '' },
    // { label: 'Backhand', value: '' },
  ],

  // TODO: add real results, newest first, e.g. { year: '2025', event: '', result: 'Champion' }
  results: [],

  offTable: {
    role: 'Core Member, Sports Club',
    org: 'Scaler School of Technology',
    line:
      'Organise and run the college’s sporting events and tournaments: draws, schedules, ' +
      'tables, and the arguments about who served.',
  },

  /*
   * RallyTrack: ball tracking from my own match footage. When it produces data, put bounce
   * points here in table coordinates (x: -1 left edge → 1 right edge, y: 0 net → 1 end line)
   * and the heatmap renders itself.
   */
  rallyTrack: {
    repo: 'https://github.com/rudhar07/RallyTrack',
    bounces: [],
  },
}
