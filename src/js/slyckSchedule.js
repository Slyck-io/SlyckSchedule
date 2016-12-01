(function(root) {
    "use strict";

    var common = {
            publicMethods: ['update', 'filter'],
            className: 'SlyckSchedule'
        },
        Protected = function(data, options) {
            var self = this,
                a,
                b,
                c;

            self.data = data;
            self.ratio = undefined;
            self.interval = 60; //Make this custom
            self.width = 1500; //This will be interval * 25
            self.height = undefined;
            self.current = undefined;
            self.filterItem = 'All';
            self.tt = {
                x: 0,
                y: 0
            };
            self.cards = [];
            self.rows = [];
            self.backup = [];
            self.scale = {
                x: 0,
                y: 0
            };
            self.count = {
                stroke: 0,
                fill: 0
            };
            self.border = {};
            self.hours = [
                ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
                ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '12:00 PM']
            ];
            self.settings = {
                id: undefined,
                data: {
                    label: undefined,
                    time: {
                        start: undefined,
                        end: undefined
                    }
                },
                debug: false,
                card: {
                    tooltip: true,
                    onClick: undefined,
                    space: 2,
                    size: 15,
                    label: {
                        size: 10,
                        color: [45, 49, 66, 1]
                    },
                    colors: [
                        [33, 150, 243, .5]
                    ],
                    strokes: [
                        [33, 150, 243, 1]
                    ]
                },
                graph: {
                    colors: {
                        background: [255, 255, 255, 1], //Need to be this right now
                        border: [192, 192, 192, .5],
                        sixty: [192, 192, 192, .5],
                        thirty: [192, 192, 192, .25],
                        time: [45, 49, 66, 1]
                    },
                    font: {
                        size: 10 //Max is 12 atm until custom step
                    },
                    time: {
                        format: '24'
                    }
                }
            };

            self.settings = this.mergeSettings(self.settings, options);

            if (typeof self.settings.data.label == 'undefined') {
                if (self.settings.debug) {
                    console.error('No Data Label Set');
                    console.error('Data Label Must be Set or we can not label the card');
                }
                return;
            }

            if (typeof self.settings.data.time == 'undefined') {
                if (self.settings.debug) {
                    console.error('No Data Times Set');
                    console.error('Data Times Must be Set or we can not place a card');
                }
                return;
            }

            if (typeof self.settings.data.time.start == 'undefined') {
                if (self.settings.debug) {
                    console.error('No Data Time Start Set');
                    console.error('Data Label Must be Set or we can not place a card');
                }
                return;
            }

            if (typeof self.settings.data.time.end == 'undefined') {
                if (self.settings.debug) {
                    console.error('No Data Time End Set');
                    console.error('Data Time End Must be Set or we can not place a card');
                }
                return;
            }

            if (self.settings.card.size < 15) {
                if (self.settings.debug) {
                    console.error('15 is the min size for the cards');
                    console.info('Setting size to 15');
                }
                self.settings.card.size = 15;
            }
            if (self.settings.card.space < 2) {
                if (self.settings.debug) {
                    console.error('2 is the min space for the cards');
                    console.info('Setting space to 2');
                }
                self.settings.card.space = 2;
            }

            if (self.settings.card.label.size >= self.settings.card.size) {
                if (self.settings.debug) {
                    console.error('Card label size is too big for card size');
                    console.info('Resized card label size to fit as big as possible in card');
                }
                self.settings.card.label.size = self.settings.card.size - 8;
            }

            this.init();

            return this;
        };

    /**
     * Main prototype
     * @type {Object}
     */
    Protected.prototype = {
        init: function() {
            var self = this;
            this.slyck = undefined;

            if (typeof this.settings.id == 'undefined') {
                this.slyck = document.getElementsByTagName("slyck-schedule")[0];
                if (typeof this.slyck == 'undefined') {
                    if (self.settings.debug) {
                        console.error('<slyck-schedule></slyck-schedule> Container not Found!');
                    }
                    return;
                }
            } else {
                this.slyck = document.getElementById(this.settings.id);
                if (typeof this.slyck == 'undefined') {
                    if (self.settings.debug) {
                        console.error(this.settings.id + ' could not Found!');
                    }
                    return;
                }
            }

            self.slyck.className = 'slyck-schedule';

            while (self.slyck.firstChild) {
                self.slyck.removeChild(self.slyck.firstChild);
            }

            self.canvas = document.createElement("canvas");
            self.context = self.canvas.getContext("2d");
            this.canvas.id = "schedule";
            this.marginLeft = -((this.width / 2) - (this.slyck.offsetWidth / 2));
            this.canvas.style.display = 'inline-block';
            this.canvas.style.marginLeft = self.marginLeft + "px";
            this.slyck.appendChild(this.canvas);
            this.checkColors();

            if (this.settings.graph.time.format == '24') {
                this.settings.graph.time.format = 0;
            } else if (this.settings.graph.time.format == '12') {
                this.settings.graph.time.format = 1;
            } else {
                if (self.settings.debug) {
                    console.error('Unsupport Time Formatting');
                    console.info('12 = 12 Hours AM/PM or 24 = 24 Hours 0000-2300');
                }
                return;
            }

            this.layout = this.layout.bind(this);
            this.draw = this.draw.bind(this);
            this.clear = this.clear.bind(this);
            this.reDraw = this.reDraw.bind(this);

            window.addEventListener('resize', self.reDraw, false);

            var dragging = false;
            var click = true;
            var lastX;

            this.canvas.addEventListener('mousedown', function(e) {
                var evt = e || event;
                dragging = true;
                click = true;
                lastX = evt.clientX;
                e.preventDefault();
            });

            this.canvas.addEventListener('mousemove', function(e) {
                var evt = e || event;
                if (dragging) {
                    click = false;
                    var delta = evt.clientX - lastX;
                    lastX = evt.clientX;
                    self.marginLeft += delta;
                    if (self.marginLeft > 0) self.marginLeft = 0;
                    if (self.marginLeft < (self.slyck.offsetWidth - self.width)) self.marginLeft = self.slyck.offsetWidth - self.width;
                    self.canvas.style.marginLeft = self.marginLeft + "px";
                }
                e.preventDefault();
            }, false);

            this.canvas.addEventListener('mouseup', function() {
                dragging = false;
            }, false);

            this.canvas.addEventListener('mousemove', function(event) {
                if (self.settings.card.tooltip) {
                    var container = self.slyck.getBoundingClientRect();
                    var rect = self.canvas.getBoundingClientRect();
                    var clickedX = event.pageX - rect.left - window.scrollX;
                    var clickedY = event.pageY - rect.top - window.scrollY;
                    var found = false;

                    for (var i = 0; i < self.cards.length; i++) {
                        if (clickedX < (self.cards[i].right) &&
                            clickedX > (self.cards[i].left) &&
                            clickedY > (self.cards[i].top) &&
                            clickedY < (self.cards[i].bottom)) {
                            self.tt.x = clickedX;
                            self.tt.y = clickedY;
                            self.current = self.cards[i];
                            self.canvas.style.cursor = 'pointer';
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        self.current = undefined;
                        self.canvas.style.cursor = 'default';
                    }
                    self.reDraw();
                }
            }, false);

            this.canvas.addEventListener('click', function(event) {
                if (click) {
                    if (typeof self.settings.card.onClick == 'undefined') {
                        if (self.settings.debug) {
                            console.error('Missing Card onClick Function');
                            console.info('The Card onClick functions lets you pass the data to a function when the user clicks on its card');
                        }
                        return;
                    }

                    var rect = self.canvas.getBoundingClientRect();
                    var clickedX = event.pageX - rect.left - window.scrollX;
                    var clickedY = event.pageY - rect.top - window.scrollY;
                    var scaleX = (self.scale.x != 0 ? self.scale.x : 1);
                    var scaleY = (self.scale.y != 0 ? self.scale.y : 1);

                    for (var i = 0; i < self.cards.length; i++) {
                        if (clickedX < (self.cards[i].right) &&
                            clickedX > (self.cards[i].left) &&
                            clickedY > (self.cards[i].top) &&
                            clickedY < (self.cards[i].bottom)) {
                            self.settings.card.onClick(self.cards[i].data);
                            break;
                        }
                    }
                }
                click = true;
            }, false);

            self.load(self.data);
            self.layout();
            self.draw();
        },
        mergeSettings: function(obj1, obj2) {
            for (var p in obj2) {
                if (obj1.hasOwnProperty(p)) {
                    try {
                        if (obj2[p].constructor == Object) {
                            obj1[p] = this.mergeSettings(obj1[p], obj2[p]);
                        } else {
                            obj1[p] = obj2[p];
                        }
                    } catch (e) {
                        obj1[p] = obj2[p];
                    }
                }
            }

            return obj1;
        },
        getCardColor: function(index, style) {
            if (style == 'fill') {
                if (this.settings.card.colors[index].length == 4) {
                    return 'rgba(' + this.settings.card.colors[index][0] + ', ' + this.settings.card.colors[index][1] + ', ' + this.settings.card.colors[index][2] + ', ' + this.settings.card.colors[index][3] + ')';
                } else if (this.settings.card.colors[index].length == 3) {
                    return 'rgb(' + this.settings.card.colors[index][0] + ', ' + this.settings.card.colors[index][1] + ',' + this.settings.card.colors[index][2] + ')';
                } else if (this.settings.card.colors[index].length == 1) {
                    return '' + this.settings.card.colors[index] + '';
                } else {
                    if (self.settings.debug) {
                        console.error('Unsupport Card Fill Color');
                        console.info('Support Colors are HEX, RGB, RGBA');
                    }
                    return;
                }
            } else if (style == 'stroke') {
                if (this.settings.card.strokes[index].length == 4) {
                    return 'rgba(' + this.settings.card.strokes[index][0] + ', ' + this.settings.card.strokes[index][1] + ', ' + this.settings.card.strokes[index][2] + ', ' + this.settings.card.strokes[index][3] + ')';
                } else if (this.settings.card.strokes[index].length == 3) {
                    return 'rgb(' + this.settings.card.strokes[index][0] + ', ' + this.settings.card.strokes[index][1] + ',' + this.settings.card.strokes[index][2] + ')';
                } else if (this.settings.card.strokes[index].length == 1) {
                    return '' + this.settings.card.strokes[index] + '';
                } else {
                    if (self.settings.debug) {
                        console.error('Unsupport Card Stroke Color');
                        console.info('Support Colors are HEX, RGB, RGBA');
                    }
                    return;
                }
            } else {

            }
        },
        checkColors: function() {
            if (this.settings.graph.colors.background.length == 4) {
                this.settings.graph.colors.background = 'rgba(' + this.settings.graph.colors.background[0] + ', ' + this.settings.graph.colors.background[1] + ', ' + this.settings.graph.colors.background[2] + ', ' + this.settings.graph.colors.background[3] + ')';
            } else if (this.settings.graph.colors.background.length == 3) {
                this.settings.graph.colors.background = 'rgb(' + this.settings.graph.colors.background[0] + ', ' + this.settings.graph.colors.background[1] + ',' + this.settings.graph.colors.background[2] + ')';
            } else if (this.settings.graph.colors.background.length == 1) {
                this.settings.graph.colors.background = '' + this.settings.graph.colors.background + '';
            } else {
                if (self.settings.debug) {
                    console.error('Unsupport Background Fill Color');
                    console.info('Support Colors are HEX, RGB, RGBA');
                }
                return;
            }
            if (this.settings.card.label.color.length == 4) {
                this.settings.card.label.color = 'rgba(' + this.settings.card.label.color[0] + ', ' + this.settings.card.label.color[1] + ', ' + this.settings.card.label.color[2] + ', ' + this.settings.card.label.color[3] + ')';
            } else if (this.settings.card.label.color.length == 3) {
                this.settings.card.label.color = 'rgb(' + this.settings.card.label.color[0] + ', ' + this.settings.card.label.color[1] + ',' + this.settings.card.label.color[2] + ')';
            } else if (this.settings.card.label.color.length == 1) {
                this.settings.card.label.color = '' + this.settings.card.label.color + '';
            } else {
                if (self.settings.debug) {
                    console.error('Unsupport Card Label Color');
                    console.info('Support Colors are HEX, RGB, RGBA');
                }
                return;
            }
            if (this.settings.graph.colors.border.length == 4) {
                this.settings.graph.colors.border = 'rgba(' + this.settings.graph.colors.border[0] + ', ' + this.settings.graph.colors.border[1] + ', ' + this.settings.graph.colors.border[2] + ', ' + this.settings.graph.colors.border[3] + ')';
            } else if (this.settings.graph.colors.border.length == 3) {
                this.settings.graph.colors.border = 'rgb(' + this.settings.graph.colors.border[0] + ', ' + this.settings.graph.colors.border[1] + ',' + this.settings.graph.colors.border[2] + ')';
            } else if (this.settings.graph.colors.border.length == 1) {
                this.settings.graph.colors.border = '' + this.settings.graph.colors.border + '';
            } else {
                if (self.settings.debug) {
                    console.error('Unsupport Border Color');
                    console.info('Support Colors are HEX, RGB, RGBA');
                }
                return;
            }
            if (this.settings.graph.colors.sixty.length == 4) {
                this.settings.graph.colors.sixty = 'rgba(' + this.settings.graph.colors.sixty[0] + ', ' + this.settings.graph.colors.sixty[1] + ', ' + this.settings.graph.colors.sixty[2] + ', ' + this.settings.graph.colors.sixty[3] + ')';
            } else if (this.settings.graph.colors.sixty.length == 3) {
                this.settings.graph.colors.sixty = 'rgb(' + this.settings.graph.colors.sixty[0] + ', ' + this.settings.graph.colors.sixty[1] + ',' + this.settings.graph.colors.sixty[2] + ')';
            } else if (this.settings.graph.colors.sixty.length == 1) {
                this.settings.graph.colors.sixty = '' + this.settings.graph.colors.sixty + '';
            } else {
                if (self.settings.debug) {
                    console.error('Unsupport Sixty Color');
                    console.info('Support Colors are HEX, RGB, RGBA');
                }
                return;
            }
            if (this.settings.graph.colors.thirty.length == 4) {
                this.settings.graph.colors.thirty = 'rgba(' + this.settings.graph.colors.thirty[0] + ', ' + this.settings.graph.colors.thirty[1] + ', ' + this.settings.graph.colors.thirty[2] + ', ' + this.settings.graph.colors.thirty[3] + ')';
            } else if (this.settings.graph.colors.thirty.length == 3) {
                this.settings.graph.colors.thirty = 'rgb(' + this.settings.graph.colors.thirty[0] + ', ' + this.settings.graph.colors.thirty[1] + ',' + this.settings.graph.colors.thirty[2] + ')';
            } else if (this.settings.graph.colors.thirty.length == 1) {
                this.settings.graph.colors.thirty = '' + this.settings.graph.colors.thirty + '';
            } else {
                if (self.settings.debug) {
                    console.error('Unsupport Thirty Color');
                    console.info('Support Colors are HEX, RGB, RGBA');
                }
                return;
            }
            if (this.settings.graph.colors.time.length == 4) {
                this.settings.graph.colors.time = 'rgba(' + this.settings.graph.colors.time[0] + ', ' + this.settings.graph.colors.time[1] + ', ' + this.settings.graph.colors.time[2] + ', ' + this.settings.graph.colors.time[3] + ')';
            } else if (this.settings.graph.colors.time.length == 3) {
                this.settings.graph.colors.time = 'rgb(' + this.settings.graph.colors.time[0] + ', ' + this.settings.graph.colors.time[1] + ',' + this.settings.graph.colors.time[2] + ')';
            } else if (this.settings.graph.colors.time.length == 1) {
                this.settings.graph.colors.time = '' + this.settings.graph.colors.time + '';
            } else {
                if (self.settings.debug) {
                    console.error('Unsupport Time Color');
                    console.info('Support Colors are HEX, RGB, RGBA');
                }
                return;
            }
        },
        Card: function(x, y, height, width, values, data) {
            return {
                left: x,
                top: y,
                right: x + height,
                bottom: y + width,
                values: values,
                data: data
            };
        },
        getOffset: function(index) {
            return (!index ? this.settings.card.size : ((index * this.settings.card.space) * 2) + this.settings.card.size);
        },
        getValues: function(data) {
            var values = {},
                a;
            for (a in data) {
                if (a == this.settings.data.label) values.label = data[a];
                if (a == this.settings.data.time.start) values.start = data[a];
                if (a == this.settings.data.time.end) values.end = data[a];
            }
            return values;
        },
        load: function(data) {
            var rows = this.rows;
            var values;
            for (var i = 0; i < data.length; i++) {
                values = this.getValues(data[i]);
                if (this.filterItem == 'All' || values.label == this.filterItem) {
                    if (i == 0) {
                        if (typeof values.label == 'undefined') {
                            if (self.settings.debug) {
                                console.error('No Data Label Found');
                                console.error('Data Label Must be Found or we can not label the card');
                            }
                            return;
                        }
                        if (typeof values.start == 'undefined') {
                            if (self.settings.debug) {
                                console.error('No Data Start Found');
                                console.error('Data Start Must be Found or we can not label the card');
                            }
                            return;
                        }
                        if (typeof values.end == 'undefined') {
                            if (self.settings.debug) {
                                console.error('No Data End Found');
                                console.error('Data End Must be Found or we can not label the card');
                            }
                            return;
                        }
                    }
                    var start_time = new Date((values.start * 1000) + (new Date().getTimezoneOffset() * 60000));
                    var end_time = new Date((values.end * 1000) + (new Date().getTimezoneOffset() * 60000));
                    var start_pos = (start_time.getHours() * this.interval) + this.interval + start_time.getMinutes();
                    var end_pos = (end_time.getHours() * this.interval) + this.interval + end_time.getMinutes();
                    var hor_index = 0;
                    var check = false;

                    if (rows.length) {
                        for (var j = 0; j < rows.length; j++) {
                            for (var x = 0; x < rows[j].length; x++) {
                                if ((rows[j][x].start == start_pos) || ((rows[j][x].start < start_pos) && (rows[j][x].end > start_pos) || ((rows[j][x].start < end_pos) && (rows[j][x].end > end_pos)) || ((rows[j][x].start < start_pos) && (rows[j][x].end > end_pos)) || ((rows[j][x].start > start_pos) && (rows[j][x].end < end_pos)))) {
                                    hor_index++;
                                    check = true;
                                    break;
                                }
                            }
                            if (!check && hor_index == j) break;
                            check = false;
                        }
                    }

                    if (!rows[hor_index]) rows.push(new Array());

                    var card = this.Card(start_pos, this.getOffset(hor_index) + (hor_index * this.settings.card.size), end_pos - start_pos, this.settings.card.size, values, data[i]);

                    rows[hor_index].push({ start: start_pos, end: end_pos, card: card });
                    this.cards.push(card);
                }
            }
            this.rows = rows;
        },
        layout: function() {
            var context = this.context;
            var pos = this.interval;

            this.canvas.width = this.width;
            this.canvas.height = this.slyck.offsetHieght;

            if (typeof this.height == 'undefined') this.height = this.rows.length + ((this.rows.length + 2) * this.settings.card.size) + ((this.rows.length) * this.settings.card.space) + this.settings.card.space + (this.settings.graph.font.size + 4);

            this.canvas.height = this.height;

            var container = this.slyck.getElementsByClassName("slyck-schedule-ui")[0];
            if (container) this.slyck.removeChild(container);

            this.container = document.createElement("div");
            this.container.className = 'slyck-schedule-ui';
            this.container.style.width = (this.slyck.offsetWidth - 2) + 'px';
            this.container.style.height = this.height - (this.settings.graph.font.size + 4) + 'px';
            this.container.style.border = this.settings.graph.colors.border + ' solid 1px';
            this.slyck.insertBefore(this.container, this.slyck.firstChild);

            var endRight = this.slyck.getElementsByClassName("end-right")[0];
            if (endRight) this.slyck.removeChild(endRight);

            this.timeRight = document.createElement("span");
            this.timeRight.className = 'end-right';
            this.timeRight.style.marginLeft = (this.slyck.offsetWidth - 60) + 'px';
            this.timeRight.style.height = this.height - (this.settings.graph.font.size + 4) + 'px';
            this.slyck.insertBefore(this.timeRight, this.slyck.firstChild);

            var endLeft = this.slyck.getElementsByClassName("end-left")[0];
            if (endLeft) this.slyck.removeChild(endLeft);

            this.timeLeft = document.createElement("span");
            this.timeLeft.className = 'end-left';
            this.timeLeft.style.height = this.height - (this.settings.graph.font.size + 4) + 'px';
            this.slyck.insertBefore(this.timeLeft, this.slyck.firstChild);

            context.save();
            context.beginPath();
            context.fillStyle = this.settings.graph.colors.background;
            context.rect(0, 0, this.width, this.height - (this.settings.graph.font.size + 4));
            context.fill();
            context.closePath();

            for (var i = 0; i < 24; i++) {
                context.beginPath();
                context.strokeStyle = this.settings.graph.colors.sixty;
                context.moveTo(pos, 0);
                context.lineTo(pos, this.height - (this.settings.graph.font.size + 4));
                context.stroke();
                context.closePath();

                context.beginPath();
                context.font = 'italic ' + this.settings.graph.font.size + 'pt Calibri';
                context.fillStyle = this.settings.graph.colors.time;
                context.fillText(this.hours[this.settings.graph.time.format][i], (pos - (context.measureText(this.hours[this.settings.graph.time.format][i]).width / 2)), this.height - 2); //Push text away from bottom
                context.closePath();

                pos += this.interval;
            }

            pos = this.interval / 2;
            for (var i = 0; i < 25; i++) {
                context.beginPath();
                context.strokeStyle = this.settings.graph.colors.thirty;
                context.moveTo(pos, 0);
                context.lineTo(pos, this.height - 10); //-10 for buffer at bottom of canvas for times
                context.stroke();
                context.closePath();

                pos += this.interval;
            }

            context.restore();
        },
        draw: function() {
            var context = this.context;
            this.count.stroke = 0;
            this.count.fill = 0;
            context.save();
            for (var i = 0; i < this.rows.length; i++) {
                for (var j = 0; j < this.rows[i].length; j++) {
                    this.drawCard(this.rows[i][j].card, i);
                    this.count.stroke = (this.count.stroke + 1) % this.settings.card.strokes.length;
                    this.count.fill = (this.count.fill + 1) % this.settings.card.colors.length;
                    // current value + 1 % array_length gives back the next value but once it hits the last element it returns to 0
                }
            }
            if (this.settings.card.tooltip && typeof this.current != 'undefined') {
                var start_time = new Date((this.current.values.start * 1000) + (new Date().getTimezoneOffset() * 60000));
                var end_time = new Date((this.current.values.end * 1000) + (new Date().getTimezoneOffset() * 60000));
                var text;
                if (this.settings.graph.time.format == 0) {
                    var h = start_time.getHours();
                    var m = start_time.getMinutes();
                    m = (m < 10 ? '0' + m : m);
                    var time = (h <= 12 ? 'am' : 'pm');
                    if (time == 'pm') h -= 12;
                    var start = h + ':' + m + ' ' + time;

                    h = end_time.getHours();
                    m = end_time.getMinutes();
                    m = (m < 10 ? '0' + m : m);
                    time = (h <= 12 ? 'am' : 'pm');
                    if (time == 'pm') h -= 12;
                    var end = h + ':' + m + ' ' + time;

                    text = start + ' til ' + end;
                }
                if (this.settings.graph.time.format == 1) {
                    var h = start_time.getHours();
                    var m = start_time.getMinutes();
                    m = (m < 10 ? '0' + m : m);
                    var start = h + ':' + m;

                    h = end_time.getHours();
                    m = end_time.getMinutes();
                    m = (m < 10 ? '0' + m : m);
                    var end = h + ':' + m;

                    text = start + ' til ' + end;
                }

                var rectWidth = context.measureText(text).width + 10;
                var rectHeight = 25;
                var rectX = this.tt.x - (rectWidth) - 2;
                var rectY = this.tt.y - (rectHeight);
                var radius = 5;
                var text_x = rectX + 5;
                var text_y = rectHeight + rectY - (this.settings.card.label.size / 2) - 2;

                context.fillStyle = 'rgba(0, 0, 0, .5)';
                context.strokeStyle = 'rgba(0, 0, 0, 1)';
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(rectX + radius, rectY);
                context.lineTo(rectX + rectWidth - radius, rectY);
                context.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
                context.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
                context.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
                context.lineTo(rectX + radius, rectY + rectHeight);
                context.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
                context.lineTo(rectX, rectY + radius);
                context.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
                context.closePath();
                context.stroke();
                context.fill();
                context.beginPath();
                context.font = this.settings.card.label.size + 'pt Calibri';
                context.fillStyle = 'rgba(255, 255, 255, 1)';
                context.fillText(text, text_x, text_y);
                context.closePath();
            }
            context.restore();
        },
        drawCard: function(card, index) {
            var context = this.context;
            var offset = this.getOffset(index);
            var text_x,
                text_y;

            context.beginPath();
            context.rect(card.left, offset + (index * this.settings.card.size), (card.right - card.left), this.settings.card.size);
            context.lineWidth = 1;
            context.strokeStyle = ((this.settings.card.strokes.length > 1) ? this.getCardColor(this.count.stroke, 'stroke') : this.getCardColor(0, 'stroke'));
            context.stroke();
            context.fillStyle = ((this.settings.card.colors.length > 1) ? this.getCardColor(this.count.fill, 'fill') : this.getCardColor(0, 'fill'));
            context.fill();
            context.closePath();

            context.beginPath();
            context.font = this.settings.card.label.size + 'pt Calibri';
            context.fillStyle = this.settings.card.label.color;

            if (context.measureText(card.values.label).width >= (card.right - card.left) ||
                ((card.right - card.left) - context.measureText(card.values.label).width) < 5) {
                if (self.settings.debug) {
                    console.error('Label width then or equal to card width or within 5');
                }
                this.settings.card.label.size -= 5;
                this.redraw();
            }

            text_x = ((card.right - card.left) / 2) + card.left - (context.measureText(card.values.label).width / 2);
            text_y = ((card.top - card.bottom) / 2) + card.bottom + (this.settings.card.label.size / 2);
            if (card.values.label.indexOf('y') != -1) text_y -= (this.settings.card.size / 10);
            context.fillText(card.values.label, text_x, text_y);
            context.closePath();
        },
        clear: function() {
            this.context.save();
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.restore();
        },
        reDraw: function() {
            this.height = undefined;
            this.clear();
            this.layout();
            this.draw();
        },
        update: function(data) {
            this.data = data;
            this.rows = [];
            this.cards = [];
            this.load(data);
            this.reDraw();
        },
        filter: function(data) {
            this.backup = this.rows;
            this.rows = [];
            this.cards = [];
            this.filterItem = data;
            this.load(this.data);
            this.reDraw();
        }
    };

    root[common.className] = function() {

        function construct(constructor, args) {

            function Class() {
                return constructor.apply(this, args);
            }
            Class.prototype = constructor.prototype;
            return new Class();
        }

        var original = construct(Protected, arguments),
            Publicly = function() {};

        Publicly.prototype = {};
        Array.prototype.forEach.call(common.publicMethods, function(member) {
            Publicly.prototype[member] = function() {
                return original[member].apply(original, arguments);
            };
        });

        return new Publicly(arguments);
    };

}(this));
