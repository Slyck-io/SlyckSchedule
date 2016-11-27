# SlyckSchedule
HTML 5 Canvas and Javascript Task Schedule

# Config
```javascript
var schedule = new SlyckSchedule(data, { //data Required
  id: undefined, //Required if more then one schedule, if one schedule it can be used or <slyck-schedule></slyck-schedule> can be used
  data: {
    label: undefined, //Required
    time: {
      start: undefined, //Required
      end: undefined //Required
    }
  },
  card: {
    onClick: undefined,
    space: 2, //Min
    size: 15, //Min
    label: {
      size: 10,
      color: [45, 49, 66, 1]
    },
    colors: [[33, 150, 243, .5]],
    strokes: [[33, 150, 243, 1]]
  },
  graph: {
    colors: {
      background: [255, 255, 255, 1], //Do not changed
      border: [192, 192, 192, .5],
      sixty: [192, 192, 192, .5],
      thirty: [192, 192, 192, .25],
      time: [45, 49, 66, 1]
    },
    font: {
      size: 10 //Max is 12
    },
    time: {
      format: '24'
    }
  }
});
```

# Install
bower install slyck-schedule
