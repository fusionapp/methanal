// import Methanal.Tests.Util
// import Methanal.Widgets
// import Methanal.Util



/**
 * Create and test trivial Column types.
 *
 * @ivar columnType: Column type to create.
 *
 * @ivar columnValues: A mapping of column identifiers to mappings of values
 *     for keys named C{id}, C{link}, C{nodeValue}.
 *
 * @ivar columns: A sequence of L{Methanal.Widgets.Column} instances.
 *
 * @ivar rowData: L{Methanal.Widgets.Row} constructed from L{columnValues}.
 */
Methanal.Tests.Util.TestCase.subclass(
    Methanal.Tests.TestWidgets, 'SimpleColumnTest').methods(
    function setUp(self) {
        var _cells = {};
        self.columns = [];
        for (var columnID in self.columnValues) {
            var values = self.columnValues[columnID];
            self.columns.push(self.columnType(columnID, 'title'));
            _cells[columnID] = Methanal.Widgets.Cell(values.value, values.link);
        }
        self.rowData = Methanal.Widgets.Row(0, _cells);
    },


    /**
     * Apply a function over each column.
     */
    function eachColumn(self, fn) {
        for (var i = 0; i < self.columns.length; ++i) {
            fn(self.columns[i]);
        }
    },


    /**
     * Extracting a value for a column from row data matches the original data
     * used to construct the cell. Attempting to extract a value for an
     * identifier that does not exist throws C{TypeError}.
     */
    function test_extractValue(self) {
        self.eachColumn(function (column) {
            self.assertIdentical(
                column.extractValue(self.rowData),
                self.columnValues[column.id].value);
            self.assertThrows(TypeError,
                function () {
                    column.extractValue({})
                });
        });
    },


    /**
     * Extracting a link for a column from row data matches the original data
     * used to construct the cell. Attempting to extract a value for an
     * identifier that does not exist throws C{TypeError}.
     */
    function test_extractLink(self) {
        self.eachColumn(function (column) {
            self.assertIdentical(
                column.extractLink(self.rowData),
                self.columnValues[column.id].link);
            self.assertThrows(TypeError,
                function () {
                    column.extractLink({})
                });
        });
    },


    /**
     * Convert a column value (generally the result of C{extractValue}) to a
     * DOM node.
     */
    function test_valueToDOM(self) {
        self.eachColumn(function (column) {
            var node = column.valueToDOM(column.extractValue(self.rowData));
            self.assertIdentical(node.nodeType, node.TEXT_NODE);
            var nodeValue = self.columnValues[column.id].nodeValue;
            self.assertIdentical(node.nodeValue, nodeValue);
        });
    });



/**
 * Tests for L{Methanal.Widgets.TextColumn}.
 */
Methanal.Tests.TestWidgets.SimpleColumnTest.subclass(
    Methanal.Tests.TestWidgets, 'TestTextColumn').methods(
    function setUp(self) {
        self.columnType = Methanal.Widgets.TextColumn;
        self.columnValues = {
            'a': {value: 'foo',
                  link: null,
                  nodeValue: 'foo'},
            'b': {value: 'bar',
                  link: 'quux',
                  nodeValue: 'bar'}};
        Methanal.Tests.TestWidgets.TestTextColumn.upcall(self, 'setUp');
    });



/**
 * Tests for L{Methanal.Widgets.IntegerColumn}.
 */
Methanal.Tests.TestWidgets.SimpleColumnTest.subclass(
    Methanal.Tests.TestWidgets, 'TestIntegerColumn').methods(
    function setUp(self) {
        self.columnType = Methanal.Widgets.IntegerColumn;
        self.columnValues = {
            'a': {value: 42,
                  link: null,
                  nodeValue: '42'},
            'b': {value: 5144,
                  link: 'quux',
                  nodeValue: '5144'}};
        Methanal.Tests.TestWidgets.TestIntegerColumn.upcall(self, 'setUp');
    });



/**
 * Tests for L{Methanal.Widgets.BooleanColumn}.
 */
Methanal.Tests.TestWidgets.SimpleColumnTest.subclass(
    Methanal.Tests.TestWidgets, 'TestBooleanColumn').methods(
    function setUp(self) {
        self.columnType = Methanal.Widgets.BooleanColumn;
        self.columnValues = {
            'a': {value: false,
                  link: null,
                  nodeValue: 'false'},
            'b': {value: true,
                  link: 'quux',
                  nodeValue: 'true'}};
        Methanal.Tests.TestWidgets.TestBooleanColumn.upcall(self, 'setUp');
    });



/**
 * Tests for L{Methanal.Widgets.TimestampColumn}.
 */
Methanal.Tests.TestWidgets.SimpleColumnTest.subclass(
    Methanal.Tests.TestWidgets, 'TestTimestampColumn').methods(
    function setUp(self) {
        self.columnType = Methanal.Widgets.TimestampColumn;

        var t1 = Methanal.Util.Time.fromTimestamp(1259973381772);
        var t2 = Methanal.Util.Time.fromTimestamp(1149573966000);

        self.columnValues = {
            'a': {value: t1,
                  link: null,
                  nodeValue: t1.asHumanly()},
            'b': {value: t2,
                  link: 'quux',
                  nodeValue: t2.asHumanly()}};
        Methanal.Tests.TestWidgets.TestTimestampColumn.upcall(self, 'setUp');
    });
