"use strict";

var $ = require("jquery"),
    devices = require("core/devices"),
    resizeCallbacks = require("core/utils/window").resizeCallbacks,
    dblclickEvent = require("events/dblclick"),
    fx = require("animation/fx"),
    Color = require("color"),
    AgendaAppointmentsStrategy = require("ui/scheduler/ui.scheduler.appointments.strategy.agenda"),
    DataSource = require("data/data_source/data_source").DataSource,
    CustomStore = require("data/custom_store");

require("ui/scheduler/ui.scheduler");

function getDeltaTz(schedulerTz) {
    var defaultTz = new Date().getTimezoneOffset() * 60000;
    return schedulerTz * 3600000 + defaultTz;
}

QUnit.module("Integration: Agenda", {
    beforeEach: function() {
        fx.off = true;
        this.createInstance = function(options) {
            this.instance = $("#scheduler").dxScheduler(options).dxScheduler("instance");
        };
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        fx.off = false;
        this.clock.restore();
    }
});

QUnit.test("Scheduler should have a right agenda work space", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda"
    });

    var $element = this.instance.element();

    assert.ok($element.find(".dx-scheduler-work-space").dxSchedulerAgenda("instance"), "Work space is agenda on init");
});

QUnit.test("Scheduler should have a right rendering strategy for agenda view", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda"
    });

    var renderingStrategy = this.instance.getLayoutManager().getRenderingStrategyInstance();

    assert.ok(renderingStrategy instanceof AgendaAppointmentsStrategy, "Strategy is OK");
});

QUnit.test("Appointments should not be resizable/draggable if current view is agenda", function(assert) {
    this.createInstance({
        views: ["agenda", "day"],
        currentView: "agenda"
    });

    var currentDevice = devices.current(),
        isMobile = currentDevice.phone || currentDevice.tablet;

    var appointments = this.instance.getAppointmentsInstance();

    assert.notOk(appointments.option("allowResize"), "Appointment is not resizable");
    assert.notOk(appointments.option("allowDrag"), "Appointment is not draggable");

    this.instance.option("currentView", "day");

    if(!isMobile) {
        assert.ok(appointments.option("allowResize"), "Appointment is resizable");
        assert.ok(appointments.option("allowDrag"), "Appointment is draggable");
    }
});

QUnit.test("Appointments should not be resizable/draggable if current view is agenda and view is object", function(assert) {
    this.createInstance({
        views: ["day", { type: "agenda", name: "My Agenda" }],
        currentView: "My Agenda"
    });

    var currentDevice = devices.current(),
        isMobile = currentDevice.phone || currentDevice.tablet;

    var appointments = this.instance.getAppointmentsInstance();

    assert.notOk(appointments.option("allowResize"), "Appointment is not resizable");
    assert.notOk(appointments.option("allowDrag"), "Appointment is not draggable");

    this.instance.option("currentView", "day");

    if(!isMobile) {
        assert.ok(appointments.option("allowResize"), "Appointment is resizable");
        assert.ok(appointments.option("allowDrag"), "Appointment is draggable");
    }
});

QUnit.test("Agenda should contain a right appointment quantity", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) },
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) },
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 28, 1, 30) }
        ]
    });

    var appointmentCount = 0;
    this.instance.element().find(".dx-scheduler-appointment").each(function() {
        var apptData = $(this).data().dxItemData;

        if(!apptData.appointmentData) {
            assert.ok(apptData.startDate);
            assert.ok(apptData.endDate);
        } else {
            assert.ok(apptData.appointmentData.startDate);
            assert.ok(apptData.appointmentData.endDate);

            assert.ok(apptData.startDate);
        }

        appointmentCount++;
    });

    assert.equal(appointmentCount, 7, "Appointment count is OK");
});

QUnit.test("Agenda appointments should have right sortedIndex", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) },
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) },
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 28, 1, 30) }
        ]
    });

    var sortedIndex = 0;
    this.instance.element().find(".dx-scheduler-appointment").each(function(index, appointment) {
        assert.equal($(appointment).data("dxAppointmentSettings").sortedIndex, sortedIndex++);
    });
});

QUnit.test("Agenda should contain a right allDay appointment parts", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 24, 0), endDate: new Date(2016, 1, 25, 0), allDay: true }
        ]
    });

    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 1, "Appointment count is OK");
});

QUnit.test("Agenda should contain a right quantity of long-appointments", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 22, 1), endDate: new Date(2016, 2, 4, 1, 30) }
        ]
    });

    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 7, "Appointment count is OK");
});

QUnit.test("Long appointment parts should have a reduced-icon and reduced class", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 22, 1), endDate: new Date(2016, 1, 28, 1, 30) }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.ok($appointments.eq(0).hasClass("dx-scheduler-appointment-reduced"), "Appointment part has a reduced-class");
    assert.equal($appointments.eq(0).find(".dx-scheduler-appointment-reduced-icon").length, 1, "Appointment part has a reduced-icon");
    assert.ok($appointments.eq(2).hasClass("dx-scheduler-appointment-reduced"), "Appointment part has a reduced-class");
    assert.equal($appointments.eq(2).find(".dx-scheduler-appointment-reduced-icon").length, 1, "Appointment part has a reduced-icon");
});

QUnit.test("Long and recurrent appointment parts should not have a reduced-icon and reduced class", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        recurrenceRuleExpr: "rRule",
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 25, 1, 30), rRule: "FREQ=DAILY;INTERVAL=3" }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.notOk($appointments.eq(0).hasClass("dx-scheduler-appointment-reduced"), "Appointment part hasn't a reduced-class");
    assert.equal($appointments.eq(0).find(".dx-scheduler-appointment-reduced-icon").length, 0, "Appointment part hasn't a reduced-icon");
    assert.notOk($appointments.eq(1).hasClass("dx-scheduler-appointment-reduced"), "Appointment part hasn't a reduced-class");
    assert.equal($appointments.eq(1).find(".dx-scheduler-appointment-reduced-icon").length, 0, "Appointment part hasn't a reduced-icon");
    assert.notOk($appointments.eq(4).hasClass("dx-scheduler-appointment-reduced"), "Appointment part hasn't a reduced-class");
    assert.equal($appointments.eq(4).find(".dx-scheduler-appointment-reduced-icon").length, 0, "Appointment part hasn't a reduced-icon");
});

QUnit.test("Particular recurrence appt should have a correct data", function(assert) {
    this.createInstance({
        views: ["agenda"],
        resources: [
            { field: "ownerId", dataSource: [{ id: 1, color: "#ff0000" }, { id: 2, color: "#0000ff" }] }
        ],
        groups: ["ownerId"],
        currentView: "agenda",
        currentDate: new Date(2015, 2, 23),
        recurrenceEditMode: "occurrence",
        dataSource: [
            {
                startDate: new Date(2015, 2, 22, 1),
                endDate: new Date(2015, 2, 22, 1, 30),
                text: "a",
                recurrenceRule: "FREQ=DAILY",
                ownerId: 1
            }
        ]
    });

    var apptIndex = 0;

    sinon.stub(this.instance, "showAppointmentPopup", function(appData, createNew, singleAppData) {
        var expectedDate = new Date(2015, 2, 23 + apptIndex);
        expectedDate.setHours(1);

        assert.equal(singleAppData.startDate.getTime(), expectedDate.getTime(), "Start date is OK");
    });

    this.instance.element().find(".dx-scheduler-appointment").each(function() {
        var $appt = $(this);

        assert.equal($appt.find(".dx-scheduler-appointment-title").text(), "a", "Title is OK");
        assert.equal(new Color($appt.css("background-color")).toHex(), "#ff0000", "Appointment color is OK");

        $appt.trigger("dxdblclick");
        apptIndex++;
    });
});

QUnit.test("Particular recurrence appt data calculation", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2015, 0, 29),
        dataSource: []
    });

    var renderingStrategy = this.instance.getRenderingStrategyInstance();
    var rows = [
        [0, 1, 0, 2, 1, 1, 1],
        [3, 0, 1, 0, 1, 1, 1]
    ];
    var expectedResults = [
        new Date(2015, 0, 30),
        new Date(2015, 1, 1),
        new Date(2015, 1, 1),
        new Date(2015, 1, 2),
        new Date(2015, 1, 3),
        new Date(2015, 1, 4),
        new Date(2015, 0, 29),
        new Date(2015, 0, 29),
        new Date(2015, 0, 29),
        new Date(2015, 0, 31),
        new Date(2015, 1, 2),
        new Date(2015, 1, 3),
        new Date(2015, 1, 4)
    ];

    for(var i = 0; i <= 12; i++) {
        assert.equal(renderingStrategy.getDateByIndex(i, rows, new Date(2015, 0, 29)).getTime(), expectedResults[i].getTime(), "Date is OK");
    }
});

QUnit.test("AllDay appointment should have specific content on agenda view", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30), allDay: true }
        ]
    });

    var $contentDetails = this.instance.element().find(".dx-scheduler-appointment-content-details"),
        $appointmentAllDayTitle = this.instance.element().find(".dx-scheduler-appointment").eq(0).find(".dx-scheduler-appointment-content-allday");

    assert.equal($contentDetails.get(0).firstChild, $appointmentAllDayTitle.get(0), "AllDay title is the first element of content");
    assert.equal($appointmentAllDayTitle.length, 1, "Appointment has an allDay title");
    assert.ok($appointmentAllDayTitle.is(":visible"), "AllDay title is visible");
});

QUnit.test("Appointment parts should have appointmentSettings field", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 22, 1), endDate: new Date(2016, 2, 4, 1, 30) }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.ok($appointments.eq(1).data("dxItemData").settings, "Appointment part has special field for settings");
    assert.equal($appointments.eq(1).data("dxItemData").settings.startDate.getTime(), new Date(2016, 1, 25, 0).getTime(), "Current date of appointment part is OK");
    assert.deepEqual($appointments.eq(0).data("dxItemData").startDate, $appointments.eq(1).data("dxItemData").startDate, "Appointments data is OK");
});

QUnit.test("Agenda should contain a right quantity of recurrence appointments", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) },
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30), recurrenceRule: "FREQ=DAILY" },
            { startDate: new Date(2016, 1, 22, 1), endDate: new Date(2016, 1, 22, 1, 30), recurrenceRule: "FREQ=DAILY" },
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 28, 1, 30) }
        ]
    });

    var appointmentCount = 0;
    this.instance.element().find(".dx-scheduler-appointment").each(function() {
        var apptData = $(this).data().dxItemData;

        if(!apptData.appointmentData) {
            assert.ok(apptData.startDate);
            assert.ok(apptData.endDate);
        } else {
            assert.ok(apptData.appointmentData.startDate);
            assert.ok(apptData.appointmentData.endDate);

            assert.ok(apptData.startDate);
        }

        appointmentCount++;
    });

    assert.equal(appointmentCount, 20, "Appointment count is OK");
});

QUnit.test("Agenda should contain a right quantity of recurrence long appointments", function(assert) {
    this.createInstance({
        views: ["agenda", "week"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24).toString(),
        endDateExpr: "End",
        startDateExpr: "Start",
        recurrenceRuleExpr: "RecurrenceRule",
        dataSource: [
            {
                Start: new Date(2016, 1, 22, 1).toString(),
                End: new Date(2016, 1, 23, 1, 30).toString(),
                RecurrenceRule: "FREQ=DAILY;INTERVAL=3",
                text: "appointment 1"
            }
        ]
    });
    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 4, "Appointment count is OK");

    this.instance.option({
        currentDate: new Date(2015, 1, 23),
        dataSource: [
            {
                Start: new Date(2015, 1, 23, 1),
                End: new Date(2015, 1, 24, 5),
                RecurrenceRule: "FREQ=DAILY;INTERVAL=3",
                text: "appointment 2"
            }
        ]
    });

    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 5, "Appointment count is OK");
});

QUnit.test("Agenda should contain a right quantity of long appointments after changing currentView", function(assert) {
    this.createInstance({
        views: ["agenda", "week"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24).toString(),
        endDateExpr: "End",
        startDateExpr: "Start",
        dataSource: [
            {
                Start: new Date(2016, 1, 24, 1),
                End: new Date(2016, 1, 26, 5),
                text: "appointment 1"
            }
        ]
    });
    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 3, "Appointment count is OK");

    this.instance.option("currentView", "week");
    this.instance.option("currentView", "agenda");

    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 3, "Appointment count is OK");
});

QUnit.test("Grouped agenda should contain a right appointment quantity", function(assert) {
    this.createInstance({
        views: ["agenda"],
        groups: ["ownerId", "roomId"],
        resources: [
            { field: "ownerId", allowMultiple: true, dataSource: [{ id: 1 }, { id: 2 }] },
            { field: "roomId", allowMultiple: true, dataSource: [{ id: 1 }, { id: 2 }] }
        ],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24).toString(),
        endDateExpr: "End",
        startDateExpr: "Start",
        dataSource: [
            {
                Start: new Date(2016, 1, 25, 1).toString(),
                End: new Date(2016, 1, 25, 1, 30).toString(),
                ownerId: [1, 2],
                roomId: 1,
                text: "one"
            }, {
                Start: new Date(2016, 1, 26, 1).toString(),
                End: new Date(2016, 1, 26, 1, 30).toString(),
                ownerId: 1,
                roomId: [1, 2],
                text: "two"
            }
        ]
    });
    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 4, "Appointment count is OK");
});

QUnit.test("Grouped agenda should contain a right long-appointment quantity", function(assert) {
    this.createInstance({
        views: ["agenda"],
        groups: ["ownerId", "roomId"],
        resources: [
            { field: "ownerId", allowMultiple: true, dataSource: [{ id: 1 }, { id: 2 }] },
            { field: "roomId", allowMultiple: true, dataSource: [{ id: 1 }, { id: 2 }] }
        ],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24).toString(),
        endDateExpr: "End",
        startDateExpr: "Start",
        dataSource: [
            {
                Start: new Date(2016, 1, 24, 1).toString(),
                End: new Date(2016, 1, 26, 1, 30).toString(),
                ownerId: [1, 2],
                roomId: 1,
                text: "one"
            }
        ]
    });

    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 6, "Appointment count is OK");
});

QUnit.test("Grouped appointments should have a correct color", function(assert) {
    this.createInstance({
        views: ["agenda"],
        groups: ["roomId", "ownerId"],
        resources: [
            { field: "ownerId", dataSource: [{ id: 1, color: "#ff0000" }, { id: 2, color: "#0000ff" }], allowMultiple: true }
        ],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24).toString(),
        endDateExpr: "End",
        startDateExpr: "Start",
        dataSource: [
            {
                Start: new Date(2016, 1, 24, 1).toString(),
                End: new Date(2016, 1, 25, 1, 30).toString(),
                ownerId: 1,
                text: "one"
            },
            {
                Start: new Date(2016, 1, 24, 1).toString(),
                End: new Date(2016, 1, 25, 1, 30).toString(),
                ownerId: 2,
                text: "two"
            }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal(new Color($appointments.eq(0).css("background-color")).toHex(), "#ff0000", "Appointment color is OK");
    assert.equal(new Color($appointments.eq(1).css("background-color")).toHex(), "#ff0000", "Appointment color is OK");

    assert.equal(new Color($appointments.eq(2).css("background-color")).toHex(), "#0000ff", "Appointment color is OK");
    assert.equal(new Color($appointments.eq(3).css("background-color")).toHex(), "#0000ff", "Appointment color is OK");
});

QUnit.test("Grouped appointments should be rendered if resources aren't defined", function(assert) {
    this.createInstance({
        views: ["agenda"],
        groups: ["roomId", "ownerId"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24).toString(),
        endDateExpr: "End",
        startDateExpr: "Start",
        dataSource: [
            {
                Start: new Date(2016, 1, 24, 1).toString(),
                End: new Date(2016, 1, 24, 1, 30).toString(),
                ownerId: 1,
                text: "one"
            },
            {
                Start: new Date(2016, 1, 24, 1).toString(),
                End: new Date(2016, 1, 24, 1, 30).toString(),
                ownerId: 2,
                text: "two"
            }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appointments.length, 2, "Appointments are rendered");
});

QUnit.test("Group row count should depend on existing appointment count", function(assert) {
    this.createInstance({
        views: ["agenda"],
        groups: ["roomId", "ownerId"],
        resources: [
            {
                field: "roomId",
                allowMultiple: true,
                dataSource: [
                    { id: 1 },
                    { id: 2 }
                ]
            },
            {
                field: "ownerId",
                allowMultiple: true,
                dataSource: [
                    { id: 1 },
                    { id: 2 }
                ]
            }
        ],
        currentView: "agenda",
        currentDate: new Date(2015, 2, 4).toString(),
        height: 800,
        dataSource: [
            {
                text: "Task 2",
                roomId: [1, 2, 3],
                ownerId: 1,
                startDate: new Date(2015, 2, 5, 8, 0).toString(),
                endDate: new Date(2015, 2, 7, 9, 0).toString()
            }, {
                text: "Task 3",
                roomId: [1, 2],
                ownerId: 1,
                startDate: new Date(2015, 2, 4, 1).toString(),
                endDate: new Date(2015, 2, 4, 2).toString()
            }
        ]
    });

    var $groupTable = this.instance.element().find(".dx-scheduler-group-table"),
        $rows = $groupTable.find(".dx-scheduler-group-row");

    assert.equal($rows.length, 2, "Row count is OK");
    assert.equal($rows.eq(0).find(".dx-scheduler-group-header").length, 2, "Cell count is OK");
    assert.equal($rows.eq(1).find(".dx-scheduler-group-header").length, 2, "Cell count is OK");
});

QUnit.test("Group header height should depend on existing appointment count", function(assert) {
    this.createInstance({
        views: ["agenda"],
        groups: ["roomId", "ownerId"],
        resources: [
            {
                field: "roomId",
                allowMultiple: true,
                dataSource: [
                    { id: 1 },
                    { id: 2 }
                ]
            },
            {
                field: "ownerId",
                allowMultiple: true,
                dataSource: [
                    { id: 1 },
                    { id: 2 }
                ]
            }
        ],
        currentView: "agenda",
        currentDate: new Date(2015, 2, 4).toString(),
        dataSource: [
            {
                text: "Task 1",
                roomId: [1, 2],
                ownerId: 1,
                startDate: new Date(2015, 2, 5, 8, 0).toString(),
                endDate: new Date(2015, 2, 7, 9, 0).toString()
            }
        ]
    });

    var $groupTable = this.instance.element().find(".dx-scheduler-group-table"),
        $headers = $groupTable.find(".dx-scheduler-group-header-content");

    assert.equal($headers.length, 4, "Header count is OK");
    assert.roughEqual($headers.eq(1).outerHeight(), 240, 2, "Header height is OK");
    assert.roughEqual($headers.eq(3).outerHeight(), 240, 2, "Header height is OK");
});

QUnit.test("Group header should be rendered in right place (T374948)", function(assert) {
    this.createInstance({
        views: ["agenda"],
        groups: ['priorityId'],
        currentView: "agenda",
        startDayHour: 6,
        endDayHour: 24,
        height: 600
    });

    var instance = this.instance,
        priorityData = [
            {
                text: "Low Priority",
                id: 1,
                color: "#1e90ff"
            }, {
                text: "High Priority",
                id: 2,
                color: "#ff9747"
            }
        ];

    instance.option("currentDate", new Date(2015, 4, 25));
    instance.option("dataSource", [
        {
            text: "Website Re-Design Plan",
            priorityId: 2,
            startDate: new Date(2015, 4, 25, 9, 0),
            endDate: new Date(2015, 4, 25, 11, 30)
        }, {
            text: "Book Flights to San Fran for Sales Trip",
            priorityId: 2,
            startDate: new Date(2015, 4, 25, 12, 0),
            endDate: new Date(2015, 4, 25, 13, 0)
        }, {
            text: "Install New Router in Dev Room",
            priorityId: 1,
            startDate: new Date(2015, 4, 25, 14, 30),
            endDate: new Date(2015, 4, 25, 15, 30)
        }, ]
    );
    instance.option("resources", [{
        field: "priorityId",
        allowMultiple: false,
        dataSource: priorityData,
        label: "Priority"
    }]);

    var $groupTable = instance.element().find(".dx-scheduler-group-table"),
        $container = instance.element().find(".dx-scheduler-date-table-scrollable .dx-scrollable-content");

    assert.equal($groupTable.length, 1, "Group table was rendered");
    assert.equal($container.children().get(0), $groupTable.get(0), "Group table was rendered in right place");
});

QUnit.test("Row count should be correct if appt ends at 0h 0m 0sec(T378182)", function(assert) {
    this.createInstance({
        dataSource: [{
            clubId: 1,
            text: "One",
            startDate: "2016-06-15T19:00:00.000Z",
            endDate: "2016-06-15T21:00:00.000Z"
        }],
        resources: [
            {
                field: "clubId",
                dataSource: [{ id: 1 }]
            }
        ],
        groups: ["clubId"],
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 5, 12)
    });

    assert.equal(this.instance.element().find(".dx-scheduler-date-table-row").length, 1, "Row count is OK");
});

QUnit.test("Agenda should contain a right appointment sorting", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 26, 1), endDate: new Date(2016, 1, 27, 1, 30), text: "e" },
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 28, 1, 30), text: "d" },
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30), text: "a" },
            { Start: new Date(2016, 1, 25, 1), endDate: new Date(2016, 1, 25, 1, 30), text: "b" },
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30), text: "c" }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appointments.eq(0).data("dxItemData").text, "d"); //24
    assert.equal($appointments.eq(1).data("dxItemData").text, "a"); //24
    assert.equal($appointments.eq(2).data("dxItemData").text, "c"); //24

    assert.equal($appointments.eq(3).data("dxItemData").text, "d"); //25
    assert.equal($appointments.eq(4).data("dxItemData").text, "b"); //25

    assert.equal($appointments.eq(5).data("dxItemData").text, "d"); //26
    assert.equal($appointments.eq(6).data("dxItemData").text, "e"); //26

    assert.equal($appointments.eq(7).data("dxItemData").text, "e"); //27
    assert.equal($appointments.eq(8).data("dxItemData").text, "d"); //27

    assert.equal($appointments.eq(9).data("dxItemData").text, "d"); //28
});

QUnit.test("Agenda should contain a right appointment sorting after adding of the new appointment", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 24, 6), endDate: new Date(2016, 1, 24, 6, 30), text: "a" },
            { Start: new Date(2016, 1, 27, 1), endDate: new Date(2016, 1, 27, 1, 30), text: "b" }
        ]
    });

    this.instance.addAppointment({ Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30), text: "c" });
    var $appointments = this.instance.element().find(".dx-scheduler-appointment");
    assert.equal($appointments.eq(0).data("dxItemData").text, "c");
    assert.equal($appointments.eq(1).data("dxItemData").text, "a");
    assert.equal($appointments.eq(2).data("dxItemData").text, "b");
});

QUnit.test("Agenda should contain a right recurrence appointment sorting", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30), text: "d" },
            { Start: new Date(2016, 1, 22, 5), endDate: new Date(2016, 1, 22, 5, 30), text: "e", recurrenceRule: "FREQ=DAILY" },
            { Start: new Date(2016, 1, 23, 2), endDate: new Date(2016, 1, 23, 2, 30), text: "f", recurrenceRule: "FREQ=DAILY" }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appointments.eq(0).data("dxItemData").text, "d"); //24
    assert.equal($appointments.eq(1).data("dxItemData").text, "f"); //24
    assert.equal($appointments.eq(2).data("dxItemData").text, "e"); //24
});

QUnit.test("Long & recurrence appts should be sorted correctly", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2015, 1, 23),
        dataSource: [
                { startDate: new Date(2015, 1, 22, 1), endDate: new Date(2015, 1, 22, 1, 30), text: "a", recurrenceRule: "FREQ=DAILY" },
                { startDate: new Date(2015, 1, 23, 3), endDate: new Date(2015, 1, 28, 3, 30), text: "long..." },
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment"),
        recurrenceApptsIndices = [0, 3, 5, 7, 9, 11, 12],
        longApptsIndices = [1, 2, 4, 6, 8, 10];

    $appointments.each(function(index, appt) {
        var $appt = $(appt),
            positionInArray;

        if($appt.hasClass("dx-scheduler-appointment-recurrence")) {
            positionInArray = recurrenceApptsIndices.indexOf(index);
            assert.notOk($appt.hasClass("dx-scheduler-appointment-reduced"), "Recurrence appt doesn't have 'reduced' class");

        } else if($appt.hasClass("dx-scheduler-appointment-reduced")) {
            positionInArray = longApptsIndices.indexOf(index);
        }

        assert.ok(positionInArray > -1, "Appointment are rendered correctly");

    });
});

QUnit.test("Appointments should have correct width & height", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24)
    });

    var agenda = this.instance.getWorkSpace(),
        rowHeight = 77,
        $element = this.instance.element(),
        timePanelWidth = $element.find(".dx-scheduler-time-panel").outerWidth(),
        expectedWidth = $element.find(".dx-scheduler-date-table").outerWidth() - timePanelWidth,
        agendaStub = sinon.stub(agenda, "_getRowHeight").returns(rowHeight);

    try {
        this.instance.option("dataSource", [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) },
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) }
        ]);

        var $appointments = this.instance.element().find(".dx-scheduler-appointment");

        assert.roughEqual($appointments.eq(0).outerHeight(), 2.001, rowHeight, "Appointment height is OK");
        assert.equal(parseInt($appointments.eq(0).css("margin-bottom"), 10), 5, "Appointment offset is OK");
        assert.roughEqual($appointments.eq(0).outerWidth(), 2.001, expectedWidth, "Appointment width is OK");

        assert.roughEqual($appointments.eq(1).outerHeight(), 2.001, rowHeight, "Appointment height is OK");
        assert.equal(parseInt($appointments.eq(1).css("margin-bottom"), 10), 20, "Appointment offset is OK");
        assert.roughEqual($appointments.eq(1).outerWidth(), 2.001, expectedWidth, "Appointment width is OK");

    } finally {
        agendaStub.restore();
    }
});

QUnit.test("Grouped appointments should have a right offsets", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        groups: ["ownerId", "roomId"],
        resources: [
            { field: "ownerId", dataSource: [{ id: 1 }, { id: 2 }], allowMultiple: true },
            { field: "roomId", dataSource: [{ id: 1 }, { id: 2 }], allowMultiple: true }
        ],
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30), roomId: [1, 2], ownerId: [1, 2] },
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30), roomId: [1, 2], ownerId: [1, 2] }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal(parseInt($appointments.eq(0).css("margin-bottom"), 10), 5, "Appointment offset is OK");
    assert.equal(parseInt($appointments.eq(1).css("margin-bottom"), 10), 20, "Appointment offset is OK");

    assert.equal(parseInt($appointments.eq(2).css("margin-bottom"), 10), 5, "Appointment offset is OK");
    assert.equal(parseInt($appointments.eq(3).css("margin-bottom"), 10), 20, "Appointment offset is OK");
});

QUnit.test("Tooltip should appear by appointment click", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) }
        ]
    });

    $(this.instance.element()).find(".dx-scheduler-appointment").trigger("dxclick");

    this.clock.tick(300);

    assert.equal($(".dx-scheduler-appointment-tooltip").length, 1, "Tooltip is rendered");
});

QUnit.test("Agenda should be rerendered when data source is changed", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) }
        ]
    });

    var $element = this.instance.element();

    assert.equal($element.find(".dx-scheduler-date-table-row").length, 1, "Date table rows are OK");
    assert.equal($element.find(".dx-scheduler-time-panel-row").length, 1, "Time panel rows are OK");

    this.instance.addAppointment({
        startDate: new Date(2016, 1, 25, 1),
        endDate: new Date(2016, 1, 25, 1, 30)
    });

    $element = this.instance.element();

    assert.equal($element.find(".dx-scheduler-date-table-row").length, 2, "Date table rows are OK");
    assert.equal($element.find(".dx-scheduler-time-panel-row").length, 2, "Time panel rows are OK");
});

QUnit.test("Appointment count should be ok after dimensionChanged", function(assert) {
    this.createInstance({
        currentDate: new Date(2016, 1, 11),
        currentView: "agenda",
        dataSource: [{
            text: "a",
            allDay: true,
            startDate: new Date(2016, 1, 11, 10),
            endDate: new Date(2016, 1, 11, 15),
            recurrenceRule: "FREQ=DAILY"
        }]
    });

    resizeCallbacks.fire();

    assert.equal(this.instance._appointments.option("items").length, 7, "Appointments are OK before rendering");
});

QUnit.test("Appts should not be repainted when the 'editing' option is changed", function(assert) {
    this.createInstance({
        currentDate: new Date(2016, 1, 11),
        currentView: "agenda",
        dataSource: [{
            text: "a",
            allDay: true,
            startDate: new Date(2016, 1, 11, 10),
            endDate: new Date(2016, 1, 11, 15),
            recurrenceRule: "FREQ=DAILY"
        }]
    });

    var apptsInstance = this.instance.getAppointmentsInstance(),
        repaintStub = sinon.stub(apptsInstance, "repaint");

    this.instance.option("editing", { allowUpdating: false });

    assert.equal(repaintStub.callCount, 0, "The 'repaint' method isn't called");
});

QUnit.test("No Data message should be rendered if agenda is empty", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: []
    });

    var $element = this.instance.element(),
        $message = $element.find(".dx-scheduler-agenda-nodata");

    assert.equal($message.length, 1, "Message was rendered");
    assert.equal($message.text(), "No data to display", "Message is correct");
});

QUnit.test("Custom No Data message should be rendered if agenda is empty", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: [],
        noDataText: "No data"
    });

    var $element = this.instance.element(),
        $message = $element.find(".dx-scheduler-agenda-nodata");

    assert.equal($message.length, 1, "Message was rendered");
    assert.equal($message.text(), "No data", "Message is correct");
});

QUnit.test("No Data message should be rendered if agenda is empty, grouped agenda", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 26),
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 25, 1, 30), group: 1 }
        ],
        groups: ['group'],
        resources: [
            {
                field: "group",
                allowMultiple: true,
                dataSource: [
                    {
                        text: "Group1",
                        id: 1
                    },
                    {
                        text: "Group2",
                        id: 2
                    }
                ]
            }]
    });

    var $element = this.instance.element(),
        $message = $element.find(".dx-scheduler-agenda-nodata");

    assert.equal($message.length, 1, "Message was rendered");
    assert.equal($message.text(), "No data to display", "Message is correct");
});

QUnit.test("No Data message should not be rendered if one group doesn't have appts, grouped agenda", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        height: 500,
        dataSource: [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 2), groupID: 1 }
        ],
        groups: ['groupID'],
        resources: [
            {
                field: "groupID",
                allowMultiple: true,
                dataSource: [
                    {
                        text: "Group1",
                        id: 1
                    },
                    {
                        text: "Group2",
                        id: 2
                    }
                ]
            }]
    });

    var $element = this.instance.element(),
        $message = $element.find(".dx-scheduler-agenda-nodata"),
        $apps = $element.find(".dx-scheduler-appointment");

    assert.equal($message.length, 0, "Message is absent");
    assert.equal($apps.length, 1, "Appointments was found");
});

QUnit.test("No Data message should be removed after dataSource changing", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: []
    });

    this.instance.option("dataSource", [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 25, 1, 30) }
    ]);

    var $element = this.instance.element(),
        $message = $element.find(".dx-scheduler-agenda-nodata");

    assert.equal($message.length, 0, "Message was remover");
});

QUnit.test("The timeZone option should be processed correctly", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 4, 6),
        timeZone: "Asia/Ashkhabad",
        dataSource: [{
            startDate: new Date(2016, 4, 7),
            startDateTimeZone: "Asia/Qyzylorda",
            endDate: new Date(2016, 4, 7, 0, 30),
            text: "a"
        }, {
            startDate: new Date(2016, 4, 7, 23),
            endDate: new Date(2016, 4, 7, 23, 59),
            text: "b"
        }]
    });

    var $element = this.instance.element(),
        $dateTableRows = $element.find(".dx-scheduler-date-table-row"),
        $timePanelRows = $element.find(".dx-scheduler-time-panel-row");

    assert.equal($timePanelRows.length, 2, "Timepanel row count is OK");
    assert.equal($dateTableRows.length, 2, "DateTable row count is OK");
});

QUnit.test("All-day appointment should not be duplicated with custom timezone", function(assert) {
    this.clock.restore();
    var timezoneDifference = getDeltaTz(5),
        getDate = function(date) {
            return new Date(date.getTime() - timezoneDifference);
        };

    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 4, 3),
        timeZone: "Asia/Ashkhabad",
        dataSource: [{
            startDate: getDate(new Date(2016, 4, 4)),
            endDate: getDate(new Date(2016, 4, 5))
        }]
    });

    var $appts = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appts.length, 1, "Appt count is OK");
});

QUnit.test("All-day appointment should not be duplicated with custom timezone (T437288)", function(assert) {
    this.clock.restore();

    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2015, 4, 18),
        timeZone: "America/Los_Angeles",
        height: 300,
        dataSource: [{
            startDate: "2015-05-25T00:00:00.000Z",
            endDate: "2015-05-26T00:00:00.000Z"
        }]
    });

    var $appts = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appts.length, 1, "Appt count is OK");
});

QUnit.test("Recurring appointment and timepanel should be rendered correctly if DST makes sense(T444318)", function(assert) {
    //can be reproduced in PST timezone
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 10, 5),
        firstDayOfWeek: 1,
        height: 300,
        onAppointmentRendered: function(e) {
            var targetedAppointmentData = e.targetedAppointmentData;
            assert.equal(targetedAppointmentData.settings.startDate.getDate(), 10, "Appointment start date is OK");
            assert.equal(targetedAppointmentData.settings.endDate.getDate(), 10, "Appointment end date is OK");
        },
        dataSource: [{
            text: "test-rec",
            startDate: new Date(2016, 10, 3, 9, 0),
            endDate: new Date(2016, 10, 3, 9, 15),
            recurrenceRule: "FREQ=WEEKLY;INTERVAL=1"
        }]
    });

    var $element = this.instance.element();
    var $appts = $element.find(".dx-scheduler-appointment");
    var timePanelDate = $element.find(".dx-scheduler-agenda-date").text();
    var timePanelDayOfWeek = $element.find(".dx-scheduler-agenda-week-day").text();

    assert.equal($appts.length, 1, "Appt count is OK");
    assert.equal(timePanelDate, "10", "Time panel date is OK");
    assert.equal(timePanelDayOfWeek, "Thu", "Time panel week day is OK");
});

QUnit.test("Recurring appointment and timepanel should be rendered correctly if DST makes sense(T444318), the second case", function(assert) {
    // can be reproduced in PST timezone
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 10, 6),
        firstDayOfWeek: 1,
        height: 300,
        dataSource: [{
            text: "test-rec",
            startDate: new Date(2016, 10, 6, 1, 0),
            endDate: new Date(2016, 10, 6, 1, 15),
            recurrenceRule: "FREQ=WEEKLY;INTERVAL=1"
        }]
    });

    var $element = this.instance.element();
    var $appts = $element.find(".dx-scheduler-appointment");
    var $timePanelDateEl = $element.find(".dx-scheduler-agenda-date");
    var $timePanelDayOfWeekEl = $element.find(".dx-scheduler-agenda-week-day");
    var timePanelDate = $timePanelDateEl.text();
    var timePanelDayOfWeek = $timePanelDayOfWeekEl.text();

    assert.equal($appts.length, 1, "Appt count is OK");
    assert.equal($timePanelDateEl.length, 1, "Timepanel cell count is OK");
    assert.equal($timePanelDayOfWeekEl.length, 1, "Timepanel cell count is OK");
    assert.equal(timePanelDate, "6", "Time panel date is OK");
    assert.equal(timePanelDayOfWeek, "Sun", "Time panel week day is OK");
});

QUnit.test("dateCellTemplate should take cellElement with correct geometry (T453520)", function(assert) {
    this.createInstance({
        currentView: "agenda",
        views: ["agenda"],
        height: 700,
        width: 700,
        currentDate: new Date(2016, 10, 28),
        dataSource: [{
            startDate: new Date(2016, 10, 28, 1),
            endDate: new Date(2016, 10, 28, 2)
        }],
        dateCellTemplate: function(cellData, cellIndex, cellElement) {
            assert.equal(cellElement.outerWidth(), 100, "Date cell width is OK");
            assert.equal(cellElement.outerHeight(), 80, "Date cell height is OK");
        }
    });
});

QUnit.test("resourceCellTemplate should take cellElement with correct geometry (T453520)", function(assert) {
    this.createInstance({
        currentView: "agenda",
        views: ["agenda"],
        height: 700,
        width: 700,
        groups: ["owner"],
        currentDate: new Date(2016, 10, 28),
        resources: [{
            fieldExpr: "owner",
            dataSource: [{ id: 1, text: "a" }]
        }],
        dataSource: [{
            startDate: new Date(2016, 10, 28, 1),
            endDate: new Date(2016, 10, 28, 2),
            owner: 1
        }],
        resourceCellTemplate: function(cellData, cellIndex, cellElement) {
            assert.equal(cellElement.outerWidth(), 80, "Resource cell width is OK");
            assert.equal(cellElement.outerHeight(), 80, "Resource cell height is OK");
        }
    });
});

QUnit.test("Long appointment parts data should be correct", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        startDayHour: 8,
        endDayHour: 20,
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 27, 1, 30), text: "a" }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appointments.eq(0).data("dxItemData").text, "a");
    assert.equal($appointments.eq(1).data("dxItemData").text, "a");
    assert.equal($appointments.eq(2).data("dxItemData").text, "a");
    assert.equal($appointments.eq(3).data("dxItemData").text, "a");

    assert.deepEqual($appointments.eq(0).data("dxItemData").Start, new Date(2016, 1, 24, 1)); //first part of long appointment has original startDate
    assert.deepEqual($appointments.eq(1).data("dxItemData").settings.Start, new Date(2016, 1, 25, 8));
    assert.deepEqual($appointments.eq(2).data("dxItemData").settings.Start, new Date(2016, 1, 26, 8));
    assert.deepEqual($appointments.eq(3).data("dxItemData").settings.Start, new Date(2016, 1, 27, 8));

    assert.deepEqual($appointments.eq(0).data("dxItemData").endDate, new Date(2016, 1, 27, 1, 30)); //first part of long appointment has original endDate
    assert.deepEqual($appointments.eq(1).data("dxItemData").settings.endDate, new Date(2016, 1, 25, 20));
    assert.deepEqual($appointments.eq(2).data("dxItemData").settings.endDate, new Date(2016, 1, 26, 20));
    assert.deepEqual($appointments.eq(3).data("dxItemData").settings.endDate, new Date(2016, 1, 27, 1, 30));
});

QUnit.test("Long appointment parts popup should have original data", function(assert) {
    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        startDayHour: 8,
        endDayHour: 20,
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 27, 1, 30), text: "a" }
        ]
    });

    var $appointment = $(this.instance.element()).find(".dx-scheduler-appointment").eq(1);
    $appointment.trigger(dblclickEvent.name);

    var detailsForm = this.instance.getAppointmentDetailsForm(),
        formData = detailsForm.option("formData");

    assert.deepEqual(formData.Start, new Date(2016, 1, 24, 1), "start is correct");
    assert.deepEqual(formData.endDate, new Date(2016, 1, 27, 1, 30), "end is correct");
    assert.equal(formData.text, "a", "text is correct");
});

QUnit.test("Long appointment should be rendered correctly after changing view", function(assert) {
    this.createInstance({
        views: ["agenda", "month"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        startDayHour: 8,
        endDayHour: 20,
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 27, 10), text: "a" }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appointments.length, 4, "appointments are OK");

    this.instance.option("currentView", "month");
    var cellWidth = this.instance.element().find(".dx-scheduler-date-table-cell").eq(0).outerWidth();
    $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appointments.length, 1, "appointment is OK");
    assert.roughEqual($appointments.eq(0).outerWidth(), cellWidth * 4, 1.001, "appointment size is OK");
});

QUnit.test("Timepanel rows count should be OK for long appointment", function(assert) {
    this.createInstance({
        views: ["agenda", "month"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        startDayHour: 8,
        endDayHour: 20,
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 27, 10), text: "a" }
        ]
    });

    var $element = this.instance.element();

    assert.equal($element.find(".dx-scheduler-time-panel-row").length, 4, "Time panel rows are OK");
});

QUnit.test("Long appointment should have a correct template", function(assert) {
    this.createInstance({
        views: ["agenda", "month"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        startDayHour: 8,
        endDayHour: 20,
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 24, 9, 30), endDate: new Date(2016, 1, 27, 10), text: "a" }
        ]
    });

    var $appts = this.instance.element().find(".dx-scheduler-appointment"),
        $firstContentDates = $appts.eq(0).find(".dx-scheduler-appointment-content-date"),
        $secondContentDates = $appts.eq(1).find(".dx-scheduler-appointment-content-date"),
        $lastContentDates = $appts.last().find(".dx-scheduler-appointment-content-date");

    assert.equal($firstContentDates.first().text(), "9:30 AM", "Start date is correct");
    assert.equal($firstContentDates.last().text(), "8:00 PM", "End date is correct");

    assert.equal($secondContentDates.first().text(), "8:00 AM", "Start date is correct");
    assert.equal($secondContentDates.last().text(), "8:00 PM", "End date is correct");

    assert.equal($lastContentDates.first().text(), "8:00 AM", "Start date is correct");
    assert.equal($lastContentDates.last().text(), "10:00 AM", "End date is correct");

});

QUnit.test("Agenda should contain a right appointment quantity after dataSource reloading", function(assert) {
    var data = [
            { startDate: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 24, 1, 30) },
    ];

    var dataSource = new DataSource({
        store: new CustomStore({
            load: function() {
                var d = $.Deferred();
                setTimeout(function() {
                    d.resolve(data);
                }, 100);
                return d.promise();
            }
        })
    });

    this.createInstance({
        views: ["agenda"],
        currentView: "agenda",
        currentDate: new Date(2016, 1, 24),
        dataSource: dataSource
    });

    this.clock.tick(100);
    dataSource.load();
    this.clock.tick(100);
    assert.equal(this.instance.element().find(".dx-scheduler-appointment").length, 1, "Appointment count is OK");
});

QUnit.test("Appointments should be rendered correctly if agenda view is set as object", function(assert) {
    this.createInstance({
        views: [{ type: "day", name: "My day" }, { type: "agenda", name: "My agenda" }],
        currentView: "My agenda",
        currentDate: new Date(2016, 1, 24),
        startDayHour: 8,
        endDayHour: 20,
        startDateExpr: "Start",
        dataSource: [
            { Start: new Date(2016, 1, 24, 1), endDate: new Date(2016, 1, 27, 10), text: "a" }
        ]
    });

    var $appointments = this.instance.element().find(".dx-scheduler-appointment");

    assert.equal($appointments.length, 4, "appointments are OK");
    assert.equal($appointments.first().position().top, 0, "appointment position is OK");
    assert.equal($appointments.last().position().top, 240, "appointment position is OK");
});
