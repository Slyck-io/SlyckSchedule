(function(root) {
    "use strict";

    var common = {
            publicMethods: ['update', 'filter', 'filterCustom'],
            className: 'SlyckSchedule'
        },
        Protected = function(data, options) {
            var self = this;

            self.data = data;
            self.interval = 60; //Make this custom
            self.width = self.interval * 25; //This will be interval * 25
            self.height = undefined;
            self.current = undefined;
            self.filterItem = 'All';
            self.filterItemCustom = 'All';
            self.status = undefined;
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
            self.border = {};
            self.hours = [
                ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
                ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '12:00 PM']
            ];
            self.settings = {
                debug: false,
                id: undefined,
                data: {
                    label: undefined,
                    time: {
                        start: undefined,
                        end: undefined
                    }
                },
                filter: {
                    field: 'course'
                },
                card: {
                    tooltip: true,
                    onClick: undefined,
                    space: 2,
                    size: 15,
                    label: {
                        size: 10
                    }
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

            //Start Check settings
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
            //End Check settings

            this.init();
            this.draw();

            return this;
        };

    Protected.prototype = {
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
        init: function() {
            var self = this; //Make self var
            this.slyck = undefined; //Create var for schedule

            //Get the div or directive and set it to slyck var
            if (typeof this.settings.id == 'undefined') {
                this.slyck = document.getElementsByTagName("slyck-schedule")[0];
                if (typeof this.slyck == 'undefined') {
                    if (self.settings.debug) console.error('<slyck-schedule></slyck-schedule> Container not Found!');
                    return;
                }
            } else {
                this.slyck = document.getElementById(this.settings.id);
                if (typeof this.slyck == 'undefined') {
                    if (self.settings.debug) console.error(this.settings.id + ' could not Found!');
                    return;
                }
            }

            //Add class to slyck element
            self.slyck.className = 'slyck-schedule';

            //Remove everthing inside the slyck element.
            while (self.slyck.firstChild) self.slyck.removeChild(self.slyck.firstChild);

            //Start Create Canvas
            self.canvas = document.createElement("canvas");
            self.context = self.canvas.getContext("2d");
            self.canvas.id = "schedule";
            self.marginLeft;
            if (this.width < this.slyck.offsetWidth) {
                self.marginLeft = 0;
            } else {
                self.marginLeft = -((this.width / 2) - (this.slyck.offsetWidth / 2));
            }
            self.canvas.style.display = 'inline-block';
            self.canvas.style.marginLeft = self.marginLeft + "px";
            this.slyck.appendChild(self.canvas);
            //End Create Canvas

            //Load Data
            this.load(this.data);

            //Start Event Listeners
            var dragging = false;
            var click = true;
            var lastX;

            //Window event for resize
            window.addEventListener('resize', function() {
                self.clear();
                self.setup();
                self.draw();
            }, false);

            //Mouse Down Event for Dragging
            this.canvas.addEventListener('mousedown', function(e) {
                var evt = e || event;
                dragging = true;
                click = true;
                lastX = evt.clientX;
                e.preventDefault();
            });

            //Mouse Move Event for Dragging
            this.canvas.addEventListener('mousemove', function(e) {
                if (self.width < self.slyck.offsetWidth) {
                    return;
                }
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

            //Mouse Up Event for Dragging
            this.canvas.addEventListener('mouseup', function() {
                dragging = false;
            }, false);


            //Mouse Over Event for Tooltip
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
                    self.draw();
                }
            }, false);

            //Mouse Click Event for OnClick
            this.canvas.addEventListener('click', function(event) {
                if (click) {
                    if (typeof self.settings.card.onClick == 'undefined') {
                        if (self.settings.debug) {
                            console.error('Missing Card onClick Function');
                            console.info('The Card onClick functions lets you pass the data to a function when the user clicks on its card');
                        }
                        return;
                    }

                    var container = self.slyck.getBoundingClientRect();
                    var rect = self.canvas.getBoundingClientRect();
                    var clickedX = event.pageX - rect.left - window.scrollX;
                    var clickedY = event.pageY - rect.top - window.scrollY;

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

            //End Event Listeners
        },
        load: function(data) {
            var temp = [];
            temp = this.cards;
            this.cards = [];
            var rows = 0;
            for (var a in data) {
                //data[a] = data[a][0] // temp data
                var fill;
                var stroke;
                var values = this.getValues(data[a]);
                var start_time = new Date((values.start * 1000) + (new Date().getTimezoneOffset() * 60000));
                var end_time = new Date((values.end * 1000) + (new Date().getTimezoneOffset() * 60000));
                var start_pos = (start_time.getHours() * this.interval) + this.interval + start_time.getMinutes();
                var end_pos = (end_time.getHours() * this.interval) + this.interval + end_time.getMinutes();
                var index = -1;
                var row;
                var indexs = [];

                for (var i in this.cards) {
                    if (this.cards[i].values.label == values.label) indexs.push(i);
                }

                if (indexs.length > 0) {
                    index = indexs[0];
                }

                if (index < 0) {
                    var r = Math.floor((Math.random() * 255) + 1);
                    var g = Math.floor((Math.random() * 255) + 1);
                    var b = Math.floor((Math.random() * 255) + 1);

                    fill = r + ', ' + g + ', ' + b;
                    stroke = r + ', ' + g + ', ' + b;
                }

                if (index >= 0) {
                    fill = this.cards[index].fill;
                    stroke = this.cards[index].stroke;
                }

                if (temp.length != 0) {
                    var t = -1;
                    for(var x in temp) {
                        if(temp[x].values.label == values.label) {
                            t = x;
                            break;
                        }
                    }
                    if (t >= 0) {
                        fill = temp[t].fill;
                        stroke = temp[t].stroke;
                    }
                }

                if (indexs.length > 0) {
                    var row;
                    var checked = [];

                    for (var i = 0; i < indexs.length; i++) {
                        row = this.cards[indexs[i]].row - 1;

                        if (checked.indexOf(row) < 0) {
                            checked.push(row);
                            if (
                                (end_pos <= this.cards[indexs[i]].left && end_pos >= this.cards[indexs[i]].right) ||
                                (start_pos >= this.cards[indexs[i]].left && start_pos <= this.cards[indexs[i]].right)
                                ) {
                                index = -1;
                            } else {
                                index = row;
                            }
                        }
                    }
                }

                if (index < 0) {
                    index = rows + 1;
                    rows++;
                } else {
                    index++;
                }

                var pos = (index * this.settings.card.size) + (index * (this.settings.card.space * 2));

                var card = new Card(
                    start_pos, //Left
                    end_pos, //Right
                    pos, //Top
                    (pos + this.settings.card.size), //Bottom
                    this.settings.card.size, //size
                    data[a], //data
                    values, //values
                    index, // row
                    1, //time
                    fill, //Fill Color
                    stroke //Stroke Color
                );

                this.cards.push(card); //add card to card array
            }

            this.rows = rows;

            //Start setup
            this.setup();
        },
        setup: function() {
            var count = this.rows + 2;
            this.height = (count * this.settings.card.size) + ((count + 2) * (this.settings.card.space * 2));

            //Start Setup DOM Elements
            var container = this.slyck.getElementsByClassName("slyck-schedule-ui")[0];
            if (container) this.slyck.removeChild(container);

            this.container = document.createElement("div");
            this.container.className = 'slyck-schedule-ui';
            this.container.style.width = ((this.width < this.slyck.offsetWidth) ? this.width + 'px' : (this.slyck.offsetWidth - 2) + 'px');
            this.container.style.height = this.height - (10 + 4) + 'px'; // 10 = font size
            this.container.style.border = 'rgba(192, 192, 192, .5) solid 1px'; // Border Color
            this.slyck.insertBefore(this.container, this.slyck.firstChild);
            //End Setup DOM Elements

            //Start Graph
            this.graph = new Graph(
                this.width, //width
                this.height, //height
                this.interval, //interval for hours 
                1 //1 = 24hrs | 0 = 12hrs
            );
            //End Graph
        },
        draw: function() {
            this.graph.show(); //Shows the Graph in the canvas
            for (var i in this.cards) {
                if ((this.filterItem == 'All' || this.cards[i].values.label == this.filterItem) && (this.filterItemCustom == 'All' || this.cards[i].values.filter == this.filterItemCustom)) {
                    this.cards[i].focus = true;
                } else {
                    this.cards[i].focus = false;
                }
                this.cards[i].show();
                if (this.settings.card.tooltip && typeof this.current != 'undefined') {
                    this.current.tooltip(this.tt.x, this.tt.y);
                }
            }
        },
        update: function(data) {
            this.load(data);
            this.clear();
            this.draw();
        },
        filterCustom: function(data) {
            this.filterItemCustom = data;
            this.clear();
            this.draw();
        },
        filter: function(data) {
            this.filterItem = data;
            this.clear();
            this.draw();
        },
        clear: function() {
            this.context.save();
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.restore();
        },
        getValues: function(data) {
            var values = {};
            for (var a in data) {
                //if (a == this.settings.data.label.split(".")[0]) values.label = data[a].FirstName //temp
                if (a == this.settings.data.label) values.label = data[a];
                if (a == this.settings.data.time.start) values.start = data[a];
                if (a == this.settings.data.time.end) values.end = data[a];
                if (a == this.settings.filter.field) values.filter = data[a];
            }
            return values;
        }
    };

    function Card(left, right, top, bottom, size, data, values, row, time, fill, stroke) {
        this.canvas = document.getElementById("schedule");
        this.context = this.canvas.getContext("2d");
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.size = size;
        this.data = data;
        this.values = values;
        this.row = row;
        this.fill = fill;
        this.stroke = stroke;
        this.time = time;
        this.focus = true; //For Filtering

        this.show = function() {
            //Start Shape
            this.context.save();
            this.context.beginPath();
            this.context.rect(this.left, this.top, (this.right - this.left), this.size);
            this.context.lineWidth = 1;
            this.context.strokeStyle = 'rgba(' + this.stroke + ',' + (this.focus ? 1 : .25) + ')';
            this.context.stroke();
            this.context.fillStyle = 'rgba(' + this.fill + ',' + (this.focus ? .5 : .15) + ')';
            this.context.fill();
            this.context.closePath();
            //End Shape

            //Start Text
            var text_x,
                text_y;
            this.context.beginPath();
            this.context.font = '10pt Calibri'; //10 = Font Size
            this.context.fillStyle = 'rgba(45, 49, 66, ' + (this.focus ? 1 : .25) + ')'; //Text Color

            text_x = ((this.right - this.left) / 2) + this.left - (this.context.measureText(this.values.label).width / 2);
            text_y = ((this.top - this.bottom) / 2) + this.bottom + (10 / 2); //10 = Font Size
            if (this.values.label.indexOf('y') != -1) text_y -= (this.size / 10);
            this.context.fillText(this.values.label, text_x, text_y);
            this.context.closePath();
            //End Text
            this.context.restore();
        }

        this.tooltip = function(x, y) {
            var text = this.formatTime(start_time, end_time);

            var rectWidth = this.context.measureText(text).width + 25;
            var rectHeight = 25;
            var rectX = x - (rectWidth) - 2;
            var rectY = y - (rectHeight);
            var radius = 5;
            var text_x = rectX + 5;
            var text_y = rectHeight + rectY - (10 / 2) - 2; //10 = Font size

            this.context.save();
            this.context.fillStyle = 'rgba(0, 0, 0, .5)';
            this.context.strokeStyle = 'rgba(0, 0, 0, 1)';
            this.context.lineWidth = 1;
            this.context.beginPath();
            this.context.moveTo(rectX + radius, rectY);
            this.context.lineTo(rectX + rectWidth - radius, rectY);
            this.context.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
            this.context.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
            this.context.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
            this.context.lineTo(rectX + radius, rectY + rectHeight);
            this.context.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
            this.context.lineTo(rectX, rectY + radius);
            this.context.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
            this.context.closePath();
            this.context.stroke();
            this.context.fill();
            this.context.beginPath();
            this.context.font = '10pt Calibri'; //10 = Font Size
            this.context.fillStyle = 'rgba(255, 255, 255, 1)';
            this.context.fillText(text, text_x, text_y);
            this.context.closePath();
            this.context.restore();
        }

        this.formatTime = function(start_time, end_time) {
            var text;
            if (this.time == 0) {
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
            if (this.time == 1) {
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

            return text;
        }

        var start_time = new Date((this.values.start * 1000) + (new Date().getTimezoneOffset() * 60000));
        var end_time = new Date((this.values.end * 1000) + (new Date().getTimezoneOffset() * 60000));

        this.tooltipText = this.formatTime(start_time, end_time);
    }

    function Graph(width, height, interval, timeFormat) {
        this.canvas = document.getElementById("schedule");
        this.context = this.canvas.getContext("2d");
        this.width = width;
        this.height = height;
        this.timeFormat = timeFormat;
        this.interval = interval;
        this.context;
        this.hours = [
            ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '12:00 PM']
        ];

        this.show = function() {
            this.width = width;
            this.height = height;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            var pos = this.interval;

            this.context.save();
            this.context.beginPath();
            this.context.fillStyle = 'rgba(255, 255, 255, 1)'; // Background Color
            this.context.rect(0, 0, this.width, this.height - (10 + 4)); //10 = font size
            this.context.fill();
            this.context.closePath();

            for (var i = 0; i < 24; i++) {
                this.context.beginPath();
                this.context.strokeStyle = 'rgba(192, 192, 192, .5)';
                this.context.moveTo(pos, 0);
                this.context.lineTo(pos, this.height - (10 + 4)); //10 = Font size
                this.context.stroke();
                this.context.closePath();

                this.context.beginPath();
                this.context.font = 'italic 10pt Calibri'; //10 = Font Size
                this.context.fillStyle = 'rgba(45, 49, 66, 1)'; //Time Label Color
                this.context.fillText(this.hours[0][i], (pos - (this.context.measureText(this.hours[0][i]).width / 2)), this.height - 2); //Push text away from bottom
                this.context.closePath();

                pos += this.interval;
            }

            pos = this.interval / 2;
            for (var i = 0; i < 25; i++) {
                this.context.beginPath();
                this.context.strokeStyle = 'rgba(192, 192, 192, .25)'; //30 mins
                this.context.moveTo(pos, 0);
                this.context.lineTo(pos, this.height - 10); //-10 for buffer at bottom of canvas for times
                this.context.stroke();
                this.context.closePath();

                pos += this.interval;
            }

            this.context.restore();
        }
    }

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
