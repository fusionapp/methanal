// import Nevow.Athena
// import Methanal.Util
// import Methanal.View
// import Methanal.Validators



/**
 * An action that can be performed on a single row of a L{Table} widget.
 *
 * @type name: C{String}
 * @ivar name: Internal name, used on the server-side to find the action method
 *
 * @type displayName: C{String}
 * @ivar displayName: User-facing name
 *
 * @type successHandler: C{function}
 * @ivar successHandler: If defined, called when the remote action method
 *     returns successfully, taking the same arguments as L{handleSuccess}
 *
 * @type icon: C{String}
 * @ivar icon: If defined, specifies a URL to an image to display as an icon
 *     alongside L{displayName}
 *
 * @type allowNavigate: C{Boolean}
 * @ivar allowNavigate: Should clicking this action allow navigation to
 *     proceed? Defaults to C{false}
 */
Divmod.Class.subclass(Methanal.Widgets, 'Action').methods(
    function __init__(self, name, displayName, successHandler/*=undefined*/,
        icon/*=undefined*/, allowNavigate/*=undefined*/) {
        self.name = name;
        self.displayName = displayName;
        self.successHandler = successHandler;
        self.icon = icon;
        self.allowNavigate = allowNavigate || false;
    },


    /**
     * Called by the C{onclick} handler created by L{toNode}, to call the
     * remote action method and dispatch the result to the relevant handler.
     */
    function _enact(self, tableWidget, row) {
        var d = tableWidget.callRemote(
            'performAction', self.name, row.id);
        return d.addCallbacks(
            function (result) {
                return self.handleSuccess(tableWidget, row, result);
            },
            function (err) {
                return self.handleFailure(tableWidget, row, err);
            });
    },


    /**
     * Called when the remote action method returns successfully,
     * L{successHandler} is called, if defined.
     */
    function handleSuccess(self, tableWidget, row, result) {
        if (self.successHandler) {
            return self.successHandler(tableWidget, row, result);
        }
    },


    /**
     * Called when the remote action method returns an error.
     */
    function handleFailure(self, tableWidget, row, err) {
        // PageWidget.showErrorDialog sucks pretty badly for anything other
        // than providing a notification that something foul is afoot.
        tableWidget.getPageWidget().showErrorDialog('performAction', err);
    },


    /**
     * Create a DOM node, representing this action, that will trigger when
     * clicked.
     *
     * @type  tableWidget: L{Methanal.Widgets.Table}
     * @param tableWidget: Parent widget
     *
     * @type  row: L{Methanal.Widgets.Row}
     * @param row: Row object to pass to handlers when the action is triggered
     *
     * @type  allowEventToNavigate: C{Boolean}
     * @param allowEventToNavigate: Use the result of
     *     L{Methanal.Widgets.Table.cellClicked} to control navigation,
     *     otherwise use L{allowNavigate}
     *
     * @rtype: DOM node
     */
    function toNode(self, tableWidget, row,
        allowEventToNavigate/*=undefined*/) {
        var onclick = function(evt) {
            self._enact(tableWidget, row);
            var navigate = tableWidget.cellClicked(this.parentNode, this.href);
            if (allowEventToNavigate) {
                return navigate;
            }
            return self.allowNavigate;
        };

        var T = Methanal.Util.DOMBuilder(tableWidget.node.ownerDocument);

        var content = [];
        if (self.icon) {
            content.push(T('img', {'class': 'table-action-icon',
                                   'src': self.icon}));
        }
        content.push(self.displayName);
        var node = T('a', {'href': '#'}, content);
        node.onclick = onclick;
        return node;
    },


    /**
     * Determine whether to enable the action for the given row.
     *
     * @type  row: L{Methanal.Widgets.Row}
     */
    function enableForRow(self, row) {
        return true;
    });



/**
 * Describes a type of column.
 *
 * @type id: C{String}
 * @ivar id: Column identifier
 *
 * @type title: C{String}
 * @ivar title: User-facing column title
 */
Divmod.Class.subclass(Methanal.Widgets, 'Column').methods(
    function __init__(self, id, title) {
        self.id = id;
        self.title = title;
    },


    /**
     * Extract the value of this column from a row.
     */
    function extractValue(self, row) {
        return row.cells[self.id].value;
    },


    /**
     * Extract the hyperlink of this column from a row.
     */
    function extractLink(self, row) {
        return row.cells[self.id].link;
    },


    /**
     * Construct a DOM object to represent a value for this column.
     */
    function valueToDOM(self, columnValue) {
        if (columnValue === undefined || columnValue === null) {
            columnValue = '';
        }
        return document.createTextNode(columnValue.toString());
    });



/**
 * Column representing text values.
 */
Methanal.Widgets.Column.subclass(Methanal.Widgets, 'TextColumn');



/**
 * Column representing integer values.
 */
Methanal.Widgets.Column.subclass(Methanal.Widgets, 'IntegerColumn');



/**
 * Column representing boolean values.
 */
Methanal.Widgets.Column.subclass(Methanal.Widgets, 'BooleanColumn');



/**
 * Column representing timestamp values.
 */
Methanal.Widgets.Column.subclass(Methanal.Widgets, 'TimestampColumn').methods(
    function valueToDOM(self, columnValue) {
        return Methanal.Widgets.TimestampColumn.upcall(
            self, 'valueToDOM', columnValue.asHumanly());
    });



/**
 * An unknown column type was encountered.
 */
Divmod.Error.subclass(Methanal.Widgets, 'UnknownColumnType');



/**
 * An invalid column identifier was given.
 */
Divmod.Error.subclass(Methanal.Widgets, 'InvalidColumn');



/**
 * Cell object for L{Methanal.Widgets.Table}.
 *
 * @ivar value: Cell value
 *
 * @type link: C{String}
 * @ivar link: Hyperlink specific to this cell, or C{null} if this cell is not
 *     linked
 */
Divmod.Class.subclass(Methanal.Widgets, 'Cell').methods(
    function __init__(self, value, link) {
        self.value = value;
        self.link = link;
    });



/**
 * Row object for L{Methanal.Widgets.Table}.
 *
 * @ivar id: Row identifier
 *
 * @type cells: Mapping of C{String} to L{Methanal.Widgets.Cell}
 * @ivar cells: Mapping of column identifiers to cell objects
 */
Divmod.Class.subclass(Methanal.Widgets, 'Row').methods(
    function __init__(self, id, cells) {
        self.id = id;
        self.cells = cells;
    });



/**
 * A widget for tabulated data.
 *
 * @type actions: C{Array} of L{Methanal.Widgets.Action}
 * @ivar actions: Available row actions, or C{null}
 *
 * @type defaultAction: L{Methanal.Widgets.Action}
 * @ivar defaultAction: An action to use when clicking any linked cell of a row,
 *     or C{null}
 *
 * @type defaultActionNavigates: C{Boolean}
 * @ivar defaultActionNavigates: Does clicking the default action invoke the
 *     normal navigation logic (determined by L{cellClicked} or
 *     L{Methanal.Widgets.Action.allowNavigate})? Defaults to C{false}
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'Table').methods(
    function __init__(self, node, args) {
        Methanal.Widgets.Table.upcall(self, '__init__', node);
        self._columns = args.columns;
        self._columnIndices = {};
        self.eachColumn(function (column, index) {
            self._columnIndices[column.id] = index;
        });
        self._rows = args.rows;

        self.actions = null;
        self.defaultAction = null;
        self.defaultActionNavigates = false;
        self._cycler = Methanal.Util.cycle('odd', 'even');
    },


    /**
     * Does this table have any additional actions associated with it?
     */
    function _hasActions(self) {
        return self.actions && self.actions.length > 0;
    },


    /**
     * Rebuild the table header elements.
     */
    function _rebuildHeaders(self) {
        var doc = self.node.ownerDocument;

        self._tableNode.deleteTHead();
        var thead = self._tableNode.createTHead();
        var tr = self._tableNode.tHead.insertRow(0);

        function insertCell(rowNode, title) {
            var td = tr.insertCell(-1);
            Methanal.Util.replaceNodeText(td, title);
        };

        self.eachColumn(function (column) {
            insertCell(tr, column.title);
        });

        if (self._hasActions()) {
            insertCell(tr, 'Actions');
        }
    },


    function nodeInserted(self) {
        self._tableNode = self.node.getElementsByTagName('table')[0];
        self._rebuildHeaders();

        if (self._rows.length > 0) {
            self.populate(self._rows);
        } else {
            self.empty();
        }
    },


    /**
     * Apply a function to each L{Methanal.Widgets.Column}.
     *
     * C{func} is given two parameters: L{Methanal.Widgets.Column} and the
     * column index.
     */
    function eachColumn(self, func) {
        for (var i = 0; i < self._columns.length; ++i) {
            func(self._columns[i], i);
        }
    },


    /**
     * Event callback called after a row is inserted into the QueryList.
     *
     * The base implementation performs row zebra striping.
     *
     * @type  index: C{Integer}
     * @param index: Index of the row in the table
     *
     * @type  node: DOM node
     * @param node: Row element node
     *
     * @type  row: L{Methanal.Widgets.Row}
     */
    function rowInserted(self, index, node, row) {
        if (node !== null) {
            Methanal.Util.addElementClass(node, self._cycler());
        }
    },


    /**
     * Event callback called after a row is removed from the QueryList.
     *
     * @type  index: C{Integer}
     * @param index: Index of the row in the table
     */
    function rowRemoved(self, index) {
    },


    /**
     * Event callback called when a cell is clicked.
     *
     * @type  cellNode: DOM node
     * @param cellNode: Table cell node that was clicked
     *
     * @type  href: C{String}
     * @param href: The C{href} attribute of the clicked anchor element
     *
     * @rtype:  C{Boolean}
     * @return: Determine whether or not navigation should proceed
     */
    function cellClicked(self, cellNode, href) {
        return true;
    },


    /**
     * Get the DOM node for the body of the QueryList.
     */
    function getBody(self) {
        return self._tableNode.tBodies[0];
    },


    /**
     * Get the DOM collection that represents the QueryList's rows.
     */
    function getRows(self) {
        return self.getBody().rows;
    },


    /**
     * Get the DOM node of a particular row.
     *
     * @type  rowIndex: C{Integer}
     *
     * @rtype: DOM node
     */
    function getRowNode(self, rowIndex) {
        return self.getRows()[rowIndex];
    },


    /**
     * Get the DOM node of a particular cell in a row.
     *
     * @type  rowIndex: C{Integer}
     *
     * @type  columnID: C{String}
     * @param columnID: Column identifier
     *
     * @raise Methanal.Widgets.InvalidColumn: If L{columnID} does not identify
     *     a column
     *
     * @rtype: DOM node
     */
    function getCellNode(self, rowIndex, columnID) {
        var columnIndex = self._columnIndices[columnID];
        if (columnIndex === undefined) {
            throw Methanal.Widgets.InvalidColumn(columnID);
        }
        return self.getRowNode(rowIndex).cells[columnIndex];
    },


    /**
     * Create a DOM node for a given L{Methanal.Widgets.Action}, but only if
     * the action is valid and enabled for the given row, otherwise return
     * C{null}.
     */
    function _makeActionNode(self, action, row, allowEventToNavigate) {
        if (action && action.enableForRow(row)) {
            return action.toNode(self, row, allowEventToNavigate);
        }
        return null;
    },


    /**
     * Create a DOM node for a table cell.
     *
     * If a link is specified, an anchor element is created. If a default
     * action has been specified for the table and a link is specified, the
     * default action is attached to the cell.
     *
     * If L{defaultActionNavigates} is C{true}, then navigation behaviour
     * is specified by the return value of L{cellClicked}; otherwise
     * L{defaultAction.allowNavigate} is used.
     *
     * @rtype: DOM node
     */
    function createCellElement(self, rowNode, column, row) {
        var doc = rowNode.ownerDocument;
        var link = column.extractLink(row);
        var contentNode;
        var onclick = function onclick(evt) {
            return self.cellClicked(this.parentNode, this.href);
        };

        if (link) {
            contentNode = doc.createElement('a');
            contentNode.href = link;
            var actionNode = self._makeActionNode(
                self.defaultAction, row, self.defaultActionNavigates);
            if (actionNode) {
                onclick = actionNode.onclick;
            }
        } else {
            contentNode = doc.createElement('span');
        }
        contentNode.onclick = onclick;

        var columnValue = column.extractValue(row);
        var content = column.valueToDOM(columnValue);
        Methanal.Util.replaceNodeContent(contentNode, [content]);
        var td = rowNode.insertCell(-1);
        td.appendChild(contentNode);
        return td;
    },


    /**
     * Create a DOM node for a row and all its cells.
     *
     * An additional column is created if the table has any actions.
     *
     * @rtype: DOM node
     */
    function createRowElement(self, index, row) {
        var tr = self.getBody().insertRow(index);
        var first = true;
        self.eachColumn(function (column) {
            var cellNode = self.createCellElement(tr, column, row);
            if (first) {
                first = false;
                // This is for IE6's benefit.
                Methanal.Util.addElementClass(cellNode, 'first-child');
            }
        });

        if (self._hasActions()) {
            var td = tr.insertCell(-1);
            for (var i = 0; i < self.actions.length; ++i) {
                var node = self._makeActionNode(self.actions[i], row);
                if (node !== null) {
                    td.appendChild(node);
                }
            }
        }

        return tr;
    },


    /**
     * Insert a row.
     *
     * After a row has been successfully inserted, L{rowInserted} is called
     * with the index, DOM node and row data.
     *
     * @type  index: C{Integer}
     * @param index: Index to insert the row before, C{-1} will append the row
     *
     * @type  row: L{Methanal.Widgets.Row}
     */
    function insertRow(self, index, row) {
        var tr = self.createRowElement(index, row);
        self.rowInserted(tr.sectionRowIndex, tr, row);
    },


    /**
     * Append a row.
     *
     * @type  row: L{Methanal.Widgets.Row}
     */
    function appendRow(self, row) {
        self.insertRow(-1, row);
    },


    /**
     * Remove a row.
     *
     * After a row has been successfully removed, L{rowRemoved} is called
     * with the index.
     *
     * @type  rowIndex: C{Integer}
     * @param rowIndex: Index of the row to remove
     */
    function removeRow(self, rowIndex) {
        self.getBody().deleteRow(rowIndex);
        self.rowRemoved(rowIndex);
    },


    /**
     * Replace all the children of a cell with new ones.
     *
     * This is a shorthand for L{Methanal.Widgets.Table.getCellNode} and
     * L{Methanal.Util.replaceNodeContent}.
     *
     * @type  row: L{Methanal.Widgets.Row}
     *
     * @type  columnID: C{String}
     *
     * @type  content: C{Array} of DOM nodes
     */
    function replaceCellContent(self, row, columnID, content) {
        var cellNode = self.getCellNode(row.id, columnID);
        Methanal.Util.replaceNodeContent(cellNode, content);
    },


    /**
     * Populate the table.
     *
     * @param rows: C{Array} of row data objects
     */
    function populate(self, rows) {
        for (var i = 0; i < rows.length; ++i) {
            self.appendRow(rows[i]);
        }
    },


    /**
     * Clear the table body.
     */
    function clear(self) {
        Methanal.Util.removeNodeContent(self.getBody());
    },


    /**
     * Clear the table and show a placeholder.
     */
    function empty(self) {
        self.clear();
        var tr = self.getBody().insertRow(-1);
        Methanal.Util.addElementClass(tr, 'methanal-table-empty-row');

        var td = tr.insertCell(-1);
        td.colSpan = self._tableNode.tHead.rows[0].cells.length;
        Methanal.Util.replaceNodeText(td, 'No items to display');
    });



/**
 * XXX: This is deprecated, use Methanal.Widgets.Table instead.
 *
 * A widget that displays data tabulated according to a set of columns.
 *
 * @type _columnIDs: C{Array}
 * @ivar _columnIDs: Identifiers to match row data to the relevant columns
 *
 * @type _rows: C{Array} of C{object} mapping C{String} to C{String}
 * @ivar _rows: Sequence of row data objects that map column identifiers
 *     to values; of specific interest is the C{__link__} key, which is
 *     the URL to use for anchor hrefs for rows
 *
 * @type _cycler: C{function}
 * @ivar _cycler: Generate alternating class names for the row style
 *
 * @type columnAliases: C{object} mapping C{String} to C{String}
 * @ivar columnAliases: Mapping of column identifiers to human readable column
 *     names
 *
 * @type actions: C{Array} of L{Mantissa.ScrollTable.Action}
 * @ivar actions: Performable actions on table rows, listed in a new column
 *     with the identifier "actions"
 *
 * @type defaultAction: L{Mantissa.ScrollTable.Action}
 * @ivar defaultAction: The action to perform when clicking on a table row
 *
 * @type defaultActionNavigates: C{boolean}
 * @ivar defaultActionNavigates: Flag indicating whether navigation should
 *     continue or not when L{defaultAction} is invoked, the default is
 *     C{false}
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'QueryList').methods(
    /**
     * Create a QueryList.
     *
     * @param args.columnIDs: See L{_columnIDs}
     *
     * @param args.columnAliases: See L{columnAliases}
     *
     * @param args.rows: See L{_rows}
     */
    function __init__(self, node, args) {
        Divmod.msg('QueryList is deprecated, use Methanal.Widgets.Table.')
        Methanal.Widgets.QueryList.upcall(self, '__init__', node);

        self._hasActions = self.actions && self.actions.length > 0;

        self._columnIDs = args.columnIDs;
        if (self.columnAliases === undefined) {
            self.columnAliases = args.columnAliases;
        }

        if (args.rows.length > 0) {
            self._rows = args.rows;
        } else {
            self._rows = null;
        }

        self._cycler = Methanal.Util.cycle('odd', 'even');
        self.defaultActionNavigates = false;
    },


    function nodeInserted(self) {
        self.table = self.node.getElementsByTagName('table')[0];
        self.rebuildHeaders();

        if (self._rows !== null) {
            self.populate(self._rows);
        } else {
            self.empty();
        }
    },


    /**
     * Get the DOM node for the body of the QueryList.
     */
    function getBody(self) {
        return self.table.tBodies[0];
    },


    /**
     * Get the DOM collection that represents the QueryList's rows.
     */
    function getRows(self) {
        return self.getBody().rows;
    },


    /**
     * Get the DOM node of a particular row.
     *
     * @type  rowIndex: C{Integer}
     */
    function getRowNode(self, rowIndex) {
        return self.getRows()[rowIndex];
    },


    /**
     * Get the DOM node of a particular cell in a row.
     *
     * @type  rowIndex: C{Integer}
     *
     * @type  columnID: C{String}
     * @param columnID: Column identifier
     */
    function getCellNode(self, rowIndex, columnID) {
        for (var i = 0; i < self._columnIDs.length; ++i) {
            if (self._columnIDs[i] == columnID) {
                return self.getRowNode(rowIndex).cells[i];
            }
        }
        throw new Error('No such column ID: ' + columnID);
    },


    /**
     * Event callback called after a row is inserted into the QueryList.
     *
     * The base implementation performs row color alternating.
     *
     * @type  index: C{Integer}
     * @param index: Index of the row in the table
     *
     * @type  node: DOM node
     * @param node: Row element node
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values
     */
    function rowInserted(self, index, node, rowData) {
        if (node !== null) {
            Methanal.Util.addElementClass(node, self._cycler());
        }
    },


    /**
     * Event callback called after a row is removed from the QueryList.
     *
     * @type  index: C{Integer}
     * @param index: Index of the row in the table
     */
    function rowRemoved(self, index) {
    },


    /**
     * Create the actions column cell.
     */
    function _makeActionsCell(self, rowData) {
        var doc = self.node.ownerDocument;
        var td = doc.createElement('td');
        for (var i = 0; i < self.actions.length; ++i) {
            var action = self.actions[i];
            var node = action.toNode(self, rowData);
            td.appendChild(node);
        }
        return td;
    },


    /**
     * Event callback called when a cell is clicked.
     *
     * If L{defaultAction} is defined then this is only called if
     * L{defaultActionNavigates} is C{false}.
     *
     * @rtype:  C{boolean}
     * @return: Determine whether or not navigation should proceed
     */
    function onCellClick(self, url) {
        return true;
    },


    /**
     * Event handler for cell "onclick" event.
     */
    function _cellClickDispatch(url, evt) {
        var _self = Nevow.Athena.Widget.get(this);
        if (_self.defaultAction) {
            var rv = this._onclick(evt);
            if (!_self.defaultActionNavigates) {
                return rv;
            }
        }

        return _self.onCellClick(url);
    },


    /**
     * Create a QueryList cell node for the given column.
     *
     * @type  columnID: C{String}
     * @param columnID: Column identifier
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values; if the
     *     C{__link__} key is defined a clickable node is created
     *
     * @rtype: DOM node
     */
    function createCellElement(self, columnID, rowData) {
        var doc = self.node.ownerDocument;
        var td = doc.createElement('td');
        var link = rowData['__link__'];
        var a;

        if (link) {
            a = doc.createElement('a');
            if (self.defaultAction) {
                var actionNode = self.defaultAction.toNode(self, rowData);
                a._onclick = actionNode.onclick;
            }
            a.onclick = self._cellClickDispatch;
            a.href = link;
        } else {
            a = doc.createElement('span');
        }
        Methanal.Util.replaceNodeText(a, rowData[columnID]);
        td.appendChild(a);
        return td;
    },


    function makeCellElement(self, columnID, rowData) {
        Divmod.msg('WARNING: QueryList.makeCellElement is deprecated. ' +
                   'Use QueryListcreateCellElement instead.');
        return self.createCellElement(columnID, rowData);
    },


    /**
     * Create a row, and all contained cells, for the given row data.
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values; if the
     *     C{__link__} key is defined a clickable node is created
     *
     * @rtype: DOM node
     */
    function createRowNode(self, rowData) {
        var tr = self.node.ownerDocument.createElement('tr');

        for (var i = 0; i < self._columnIDs.length; ++i) {
            var cid = self._columnIDs[i];
            var cell = self.createCellElement(cid, rowData);
            if (i == 0) {
                // Thank you IE6 for failing at life.
                Methanal.Util.addElementClass(cell, 'first-child');
            }
            tr.appendChild(cell);
        }

        if (self._hasActions) {
            tr.appendChild(self._makeActionsCell(rowData));
        }

        return tr;
    },


    /**
     * Insert a row.
     *
     * @type  index: C{Integer}
     * @param index: Index to insert the row before, C{-1} will append the row
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values
     */
    function insertRow(self, index, rowData) {
        var doc = self.node.ownerDocument;
        var tr = self.createRowNode(rowData);
        var before = index >= 0 ? self.getBody().rows[index] : null;
        self.getBody().insertBefore(tr, before);
        self.rowInserted(index, tr, rowData);
    },


    /**
     * Append a row.
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values
     */
    function appendRow(self, rowData) {
        self.insertRow(-1, rowData);
    },


    /**
     * Remove a row.
     *
     * @type  rowIndex: C{Integer}
     * @param rowIndex: Index of the row to remove
     */
    function removeRow(self, rowIndex) {
        self.getBody().deleteRow(rowIndex);
        self.rowRemoved(rowIndex);
    },


    /**
     * Empty the table and show a placeholder.
     */
    function empty(self) {
        var table = self.table;
        var tr = table.insertRow(-1);
        Methanal.Util.addElementClass(tr, 'methanal-query-list-empty-row');

        var td = tr.insertCell(-1);
        td.colSpan = table.tHead.rows[0].cells.length;
        Methanal.Util.replaceNodeText(td, 'No items to display');

        Methanal.Util.replaceNodeContent(self.getBody(), [tr]);
        self.rowInserted(null, null, null);
    },


    /**
     * Populate the QueryList.
     *
     * @type  rows: C{Array} of C{object} mapping C{String} to C{String}
     * @param rows: Sequence of row data objects that map column identifiers
     *     to values
     */
    function populate(self, rows) {
        for (var i = 0; i < rows.length; ++i) {
            self.appendRow(rows[i]);
        }
    },


    /**
     * Determine a column alias from a column identifier.
     */
    function _getColumnAlias(self, id) {
        var alias = self.columnAliases[id];
        return alias ? alias : id;
    },


    /**
     * Determine the column identifiers for the QueryList header.
     *
     * @rtype:  C{Array} of C{String}
     */
    function _createHeaderData(self) {
        var headerData = [];
        for (var i = 0; i < self._columnIDs.length; ++i) {
            headerData.push(self._columnIDs[i]);
        }

        if (self._hasActions) {
            headerData.push('actions');
        }

        return headerData;
    },


    /**
     * Create the QueryList header element.
     */
    function rebuildHeaders(self) {
        self.table.deleteTHead();

        var headerData = self._createHeaderData();

        var doc = self.node.ownerDocument;
        var thead = doc.createElement('thead');
        var tr = doc.createElement('tr');
        for (var i = 0; i < headerData.length; ++i) {
            var td = doc.createElement('td');
            td.id = headerData[i];
            Methanal.Util.replaceNodeText(td, self._getColumnAlias(td.id));
            tr.appendChild(td);
        }
        thead.appendChild(tr);
        self.table.appendChild(thead)
    });



/**
 * A filtering search widget.
 *
 * Essentially just a form that results in a server-side call, on submission,
 * and a result widget.
 *
 * @type _currentResultWidget: L{Nevow.Athena.Widget}
 * @ivar _currentResultWidget: Current result widget; everytime a new result
 *     is generated, the old widget is detached
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'FilterList').methods(
    function __init__(self, node) {
        Methanal.Widgets.FilterList.upcall(self, '__init__', node);
        self._currentResultWidget = null;
    },


    /**
     * Set the result widget.
     *
     * If a result widget was previously set, it is detached and removed
     * from the DOM.
     *
     * @param widgetInfo: Athena widget information to create a new child widget
     *     from
     *
     * @rtype:  C{Deferred}
     * @return: Deferred that fires when the result widget has been set
     */
    function setResultWidget(self, widgetInfo) {
        var resultsNode = self.nodeById('results');

        var d = self.widgetParent.addChildWidgetFromWidgetInfo(widgetInfo);
        d.addCallback(function (widget) {
            if (self._currentResultWidget !== null) {
                self._currentResultWidget.detach();
                resultsNode.removeChild(self._currentResultWidget.node);
            } else {
                resultsNode.style.display = 'block';
            }

            resultsNode.appendChild(widget.node);
            Methanal.Util.nodeInserted(widget);
            self._currentResultWidget = widget;
        });
        return d;
    });



/**
 * L{Methanal.View.LiveForm} subclass for L{Methanal.Widgets.FilterList}.
 *
 * Set the result widget on successful form submission.
 *
 * Widgets derived from L{Methanal.Widgets.FilterList} should use a form
 * that inherits from this.
 */
Methanal.View.LiveForm.subclass(Methanal.Widgets, 'FilterListForm').methods(
    function submitSuccess(self, widgetInfo) {
        return self.widgetParent.setResultWidget(widgetInfo);
    });



/**
 * A collapsable container widget.
 *
 * @type _params: C{object} mapping C{String} to values
 * @ivar _params: Mapping of names to values, used specifically for
 *     L{Methanal.Widgets.Rollup.update}
 *
 * @type expanded: C{boolean}
 * @ivar expanded: Flag indicating whether the container is expanded or not
 *
 * @type throbber: L{Methanal.Util.Throbber}
 * @ivar throbber: Throbber controller
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'Rollup').methods(
    /**
     * Create the rollup widget.
     *
     * @type params: C{object} mapping C{String} to values
     * @ivar params: Mapping of names to values, used specifically for
     *     L{Methanal.Widgets.Rollup.update}
     */
    function __init__(self, node, params) {
        Methanal.Widgets.Rollup.upcall(self, '__init__', node);
        self.expanded = false;
        self._params = params;
    },


    function nodeInserted(self) {
        self._contentNode = self.nodeById('content');
        self._buttonNode = self.nodeById('roll-button');
        self._totalNode = self.nodeById('summary-total');
        self._summaryDescNode = self.nodeById('summary-description');
        self.throbber = Methanal.Util.Throbber(self)

        self.update(self._params);
    },


    /**
     * Toggle the rollup's expanded state.
     */
    function toggleExpand(self) {
        self.expanded = !self.expanded;

        self._contentNode.style.display = self.expanded ? 'block' : 'none';

        var buttonNode = self._buttonNode;
        if (self.expanded) {
            Methanal.Util.addElementClass(buttonNode, 'roll-up');
            Methanal.Util.removeElementClass(buttonNode, 'roll-down');
        } else {
            Methanal.Util.removeElementClass(buttonNode, 'roll-up');
            Methanal.Util.addElementClass(buttonNode, 'roll-down');
        }
        return false;
    },


    /**
     * Update the rollup view.
     *
     * The base implementation updates the node, with ID "summary-description",
     * with the value from the key "summary".
     *
     * @type params: C{object} mapping C{String} to values
     * @ivar params: Mapping of names to values, used specifically for
     *     L{Methanal.Widgets.Rollup.update}
     */
    function update(self, params) {
        var summary = params['summary'];
        summary = summary === undefined ? '' : summary;
        Methanal.Util.replaceNodeText(self._summaryDescNode, summary);
    });



Methanal.View.FormInput.subclass(Methanal.Widgets, 'Lookup');



/**
 * Form for L{Methanal.Widgets.SimpleLookup}.
 *
 * When a value of any input (excluding the result selector) is changed,
 * a remote call is made (passing the values of all the inputs) and the result
 * selector populated from the result of that call.
 */
Methanal.View.SimpleForm.subclass(Methanal.Widgets, 'SimpleLookupForm').methods(
    function __init__(self, node, controlNames) {
        Methanal.Widgets.SimpleLookupForm.upcall(
            self, '__init__', node, controlNames);

        var V = Methanal.Validators;
        self.addValidators([
            [['__results'], [V.notNull]]]);
    },


    /**
     * Set the result values.
     *
     * @type  values: C{Array} of C{[String, object]}
     * @param values: Sequence of C{[value, description]} results
     */
    function setOptions(self, values) {
        var resultsWidget = self.getControl('__results');
        var resultsNode = resultsWidget.inputNode;
        while (resultsNode.options.length) {
            resultsNode.remove(0);
        }

        var doc = self.node.ownerDocument;
        for (var i = 0; i < values.length; ++i) {
            var optionNode = doc.createElement('option');
            optionNode.value = values[i][0];
            optionNode.appendChild(doc.createTextNode(values[i][1]));
            resultsNode.appendChild(optionNode);
        }

        var value = null;
        if (resultsNodes.options.length > 0) {
            value = resultsNode[0];
        }
        resultsWidget.setValue(value);
        resultsWidget.onChange();
    },


    function valueChanged(self, control) {
        Methanal.Widgets.SimpleLookupForm.upcall(self, 'valueChanged', control);

        // Don't trigger when the result input is changed.
        if (control.name === '__results') {
            return;
        }

        // Gather form values from all the filter attributes.
        var values = {};
        for (var controlName in self.controls) {
            var control = self.getControl(controlName);
            values[controlName] = control.getValue();
        }

        // Pass the gathered values to the remote side, and populate the result
        // input from the return value of that call.
        var d = self.widgetParent.callRemote('populate', values);
        d.addCallback(function (values) {
            self.setOptions(values);
        });
    });



/**
 * Modal dialog widget.
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'ModalDialog').methods(
    function nodeInserted(self) {
        var T = Methanal.Util.DOMBuilder(self.node.ownerDocument);
        self._overlayNode = T('div', {'class': 'modal-dialog-overlay'});
        self.node.parentNode.appendChild(self._overlayNode);
    },


    /**
     * Dismiss the dialog.
     */
    function close(self) {
        self.detach();
        self.node.parentNode.removeChild(self.node);
        self._overlayNode.parentNode.removeChild(self._overlayNode);
    });



/**
 * Create a modal dialog from Athena widget information.
 *
 * @type widgetParent: C{Nevow.Athena.Widget}
 *
 * @param widgetInfo: Widget information for the modal dialog.
 *
 * @rtype: C{Deferred} -> C{Nevow.Athena.Widget}
 */
Methanal.Widgets.ModalDialog.fromWidgetInfo = function fromWidgetInfo(widgetParent, widgetInfo) {
    var d = widgetParent.addChildWidgetFromWidgetInfo(widgetInfo);
    return d.addCallback(function (widget) {
        widgetParent.node.appendChild(widget.node);
        Methanal.Util.nodeInserted(widget);
        return widget;
    });
};



/**
 * Cancel form action.
 *
 * Invoking this actions calls L{Methanal.Widgets.ModalDialogForm.cancel}.
 */
Methanal.View.ActionButton.subclass(Methanal.Widgets, 'CancelAction').methods(
    function invoke(self) {
        return self.getForm().cancel();
    });



/**
 * Base class for modal dialog forms.
 *
 * Provides functionality for dismissing the dialog when a form action is
 * invoked.
 */
Methanal.View.LiveForm.subclass(Methanal.Widgets, 'ModalDialogForm').methods(
    function nodeInserted(self) {
        Methanal.Widgets.ModalDialogForm.upcall(self, 'nodeInserted');
        self.focusFirstInput();
    },


    function submit(self) {
        var d = Methanal.Widgets.ModalDialogForm.upcall(self, 'submit');
        d.addCallback(function (result) {
            self.widgetParent.close();
            return result;
        });
        return d;
    },


    /**
     * Dismiss the dialog.
     */
    function cancel(self) {
        self.widgetParent.close();
        return false;
    });



/**
 * An unknown tab identifier was specified.
 */
Divmod.Error.subclass(Methanal.Widgets, 'UnknownTab');



/**
 * An unknown group identifier was specified.
 */
Divmod.Error.subclass(Methanal.Widgets, 'UnknownGroup');



/**
 * A tab container, visually displayed as a horizontal tab bar.
 *
 * @ivar tabIDs: Mapping of L{Tab.id}, used conceptually as a set, used for
 *     tracking tab loading.
 *
 * @type topLevel: C{Boolean}
 * @ivar topLevel: Is this a top-level TabView? Top-level TabViews will use
 *     the fragment part of the current URL to track which tab is selected,
 *     this behaviour supercedes L{Tab.selected}.
 *
 * @type fullyLoaded: C{Boolean}
 * @ivar fullyLoaded: Have all the tabs finished loading?
 *
 * @ivar _labels: Mapping of L{Tab.id} to DOM nodes of the tab labels.
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'TabView').methods(
    function __init__(self, node, tabIDs, tabGroups, topLevel) {
        Methanal.Widgets.TabView.upcall(self, '__init__', node);
        self.tabIDs = tabIDs;
        self.tabGroups = tabGroups;
        self.topLevel = topLevel;
        if (self.topLevel) {
            self._idToSelect = self._getTabIDFromLocation();
        }
        self._labels = {};
        self._tabs = {};
        self._groups = {};
        self.fullyLoaded = false;
        self.throbber = Methanal.Util.Throbber(self, 'inline');
        self.throbber.start();
    },


    /**
     * Extract the identifier of the selected tab from the current location.
     *
     * @rtype: C{String}
     * @return: The identifier of the selected tab, or C{undefined} if no usable
     *     information is found in the current location.
     */
    function _getTabIDFromLocation(self) {
        if (window.location.hash) {
            var identifier = window.location.hash.substring(1);
            var parts = identifier.split(':');
            if (parts[0] == 'tab') {
                return parts[1];
            }
        }
    },


    /**
     * Get a L{Methanal.Widgets.Tab} instance for a given tab identifier.
     */
    function getTab(self, id) {
        var tab = self._tabs[id];
        if (tab === undefined) {
            throw new Methanal.Widgets.UnknownTab(
                Methanal.Util.repr(id) + ' is an unknown tab identifier');
        }
        return tab;
    },


    /**
     * Get the first visible tab.
     *
     * @raise Methanal.Widgets.UnknownTab: If there are no visible tabs.
     */
    function getFirstVisibleTab(self) {
        for (var i = 0; i < self.childWidgets.length; ++i) {
            var tab = self.childWidgets[i];
            if (tab.visible) {
                return tab;
            }
        }
        throw new Methanal.Widgets.UnknownTab('No visible tabs');
    },


    /**
     * Client-side handler for appending a tabs from the server-side.
     */
    function _appendTabsFromServer(self, widgetInfos, tabGroups) {
        self.throbber.start();
        self.tabGroups = tabGroups;

        function _appendTab(widgetInfo) {
            var d = self.addChildWidgetFromWidgetInfo(widgetInfo);
            d.addCallback(function (widget) {
                self.tabIDs[widget.id] = true;
                self.node.appendChild(widget.node);
                Methanal.Util.nodeInserted(widget);
                return null;
            });
            return d;
        }

        var ds = Methanal.Util.map(_appendTab, widgetInfos);
        return Divmod.Defer.gatherResults(ds);
    },


    /**
     * Create the DOM node for a tab group.
     *
     * @raise Methanal.Widgets.UnknownGroup: If C{id} does not map to any known
     *     group.
     */
    function _createGroupNode(self, id) {
        var title = self.tabGroups[id].title;
        if (title === undefined) {
            throw Methanal.Widgets.UnknownGroup(
                Methanal.Util.repr(id) +
                ' is an unknown tab group identifier');
        }

        var D = Methanal.Util.DOMBuilder(self.node.ownerDocument);
        var group = D('ul', {'class': 'methanal-tab-group-tabs'}, []);
        self._groups[id] = group;
        var groupInner = D(
            'li', {'class': 'methanal-tab-label methanal-tab-group'}, [
                D('div', {'class': 'methanal-tab-group-label'}, [title]),
                group]);
        self.nodeById('labels').appendChild(groupInner);
    },


    /**
     * Get the DOM node for a group, creating it if it doesn't already exist.
     */
    function _getGroupNode(self, id) {
        if (!(id in self._groups)) {
            self._createGroupNode(id);
        }
        return self._groups[id];
    },


    /**
     * Begin managing a new L{Tab} widget.
     *
     * A new label is created for C{tab}, based on L{Tab.title}, and an
     * C{onclick} handler attached.
     */
    function appendTab(self, tab) {
        function onclick(node) {
            self.selectTab(tab);
        }

        var D = Methanal.Util.DOMBuilder(self.node.ownerDocument);
        var label = D('li', {'class': 'methanal-tab-label'}, [
            D('a', {}, [tab.title])]);
        label.onclick = onclick;

        var labelClassName = tab.getLabelClassName();
        if (labelClassName) {
            Methanal.Util.addElementClass(label, labelClassName);
        }

        self._labels[tab.id] = label;
        self._tabs[tab.id] = tab;

        var labelParent = self.nodeById('labels');
        if (tab.group !== null) {
            labelParent = self._getGroupNode(tab.group);
        }
        labelParent.appendChild(label);

        // If this tab's identifier matches the one we're supposed to select,
        // do it. Otherwise select this tab if its "selected" attribute is true
        // and no tab selection has been made yet.
        if (tab.id == self._idToSelect) {
            self._tabToSelect = tab;
        } else if (self._tabToSelect === undefined && tab.selected) {
            self._tabToSelect = tab;
        }
    },


    /**
     * Select a tab.
     *
     * If this is a top-level TabView, the newly selected tab is tracked.
     */
    function selectTab(self, tab) {
        for (var i = 0; i < self.childWidgets.length; ++i) {
            self.childWidgets[i].deselect();
        }
        for (var id in self._labels) {
            Methanal.Util.removeElementClass(
                self._labels[id], 'selected-tab-label');
        }
        var labelNode = self._labels[tab.id];
        Methanal.Util.addElementClass(labelNode, 'selected-tab-label');
        tab.select();

        if (self.topLevel) {
            window.location.hash = 'tab:' + tab.id;
        }

        if (!self.fullyLoaded) {
            self._tabToSelect = self._idToSelect = null;
        }
    },


    /**
     * Make the specified tab visible.
     *
     * If this is the first tab to be made visible, it is selected.
     */
    function showTab(self, tab) {
        var labelNode = self._labels[tab.id];
        labelNode.style.display = 'inline';
        // If this is the only tab about to be visible, select it.
        try {
            self.getFirstVisibleTab();
        } catch (e) {
            if (!(e instanceof Methanal.Widgets.UnknownTab)) {
                throw e;
            }
            self.selectTab(self);
        }
        tab.visible = true;
    },


    /**
     * Hide the specified tab.
     *
     * The tab label is hidden for the given tab; if the specified tab is also
     * the selected tab, the first visible tab will be selected.
     */
    function hideTab(self, tab) {
        var labelNode = self._labels[tab.id];
        labelNode.style.display = 'none';
        tab.visible = false;
        // If we're hiding the selected tab, select the first visible tab.
        if (tab.selected) {
            try {
                self.selectTab(self.getFirstVisibleTab());
            } catch (e) {
                if (!(e instanceof Methanal.Widgets.UnknownTab)) {
                    throw e;
                }
            }
        }
    },


    /**
     * Report a tab as having finished loading.
     *
     * Once all tabs in L{tabIDs} have reported in, loading of the TabView is
     * finalised by calling L{_finishLoading}.
     */
    function loadedUp(self, tab) {
        self.appendTab(tab);

        delete self.tabIDs[tab.id];
        for (var id in self.tabIDs) {
            return;
        }

        self._finishLoading();
    },


    /**
     * Finalise TabView loading.
     */
    function _finishLoading(self) {
        self.throbber.stop();
        if (self.fullyLoaded) {
            return;
        }

        self.fullyLoaded = true;
        if (self._tabToSelect === undefined && self.childWidgets.length > 0) {
            self._tabToSelect = self.childWidgets[0];
        }
        if (self._tabToSelect) {
            self.selectTab(self._tabToSelect);
        }
    });



/**
 * Visually group labels of L{Methanal.Widgets.Tab}s together.
 *
 * @type id: C{unicode}
 * @ivar id: Unique identifier.
 *
 * @type title: C{unicode}
 * @ivar title: Title of the group, used by L{Methanal.Widgets.TabView} when
 *     constructing the tab list.
 */
Divmod.Class.subclass(Methanal.Widgets, 'TabGroup').methods(
    function __init__(self, id, title) {
        self.id = id;
        self.title = title;
    });



/**
 * A content container, intended to be passed to L{TabView}.
 *
 * @type id: C{String}
 * @ivar id: Unique identifier for this container.
 *
 * @type title: C{String}
 * @ivar title: Title of the container, used by L{TabView} when constructing
 *     the tab list.
 *
 * @type selected: C{Boolean}
 * @ivar selected: Is this container to be selected initially? Defaults to
 *     C{False}.
 *
 * @type group: C{String}
 * @ivar group: Tab group identifier, or C{null} for no grouping.
 *
 * @type visible: C{Boolean}
 * @ivar visible: Is this container visible?
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'Tab').methods(
    function __init__(self, node, args) {
        Methanal.Widgets.Tab.upcall(self, '__init__', node);
        self.id = args.id;
        self.title = args.title;
        self.selected = args.selected;
        self.group = args.group;
        self.visible = true;
        self._cancelFetch = function() {};
        self._currentWidget = undefined;
    },


    function nodeInserted(self) {
        self.widgetParent.loadedUp(self);
    },


    /**
     * Get the class name to use for this tab's label.
     *
     * @rtype: C{String}
     * @return: Class name to use, or C{undefined} if there is none.
     */
    function getLabelClassName(self) {
    },


    /**
     * Set the tab content.
     *
     * @type content: DOM node
     */
    function _setContent(self, content) {
        Methanal.Util.replaceNodeContent(self.nodeById('content'), [content]);
    },


    /**
     * Show a placeholder in the tab content area.
     */
    function showPlaceholder(self) {
        var D = Methanal.Util.DOMBuilder(self.node.ownerDocument);
        var placeholder = D('div', {'class': 'placeholder'}, []);
        self._setContent(placeholder);
    },


    /**
     * Fetch the latest tab content from the server.
     *
     * If a fetch is already in progress it's result is discarded and a new
     * fetch takes place.
     */
    function fetchContent(self) {
        self.showPlaceholder();

        if (self._currentWidget !== undefined) {
            self._currentWidget.detach();
            self._currentWidget = undefined;
        }
        self._cancelFetch();

        var abortFetch = false;
        self._cancelFetch = function() {
            abortFetch = true;
        };

        var d = self.callRemote('getContent');
        d.addCallback(function (widgetInfo) {
            return self.addChildWidgetFromWidgetInfo(widgetInfo);
        });
        d.addCallback(function (widget) {
            if (abortFetch) {
                return widget.detach();
            } else {
                self._setContent(widget.node);
                self._currentWidget = widget;
                Methanal.Util.nodeInserted(widget);
            }
        });
        return d;
    },


    /**
     * Apply selection styles.
     */
    function _applySelection(self) {
        var fn = Methanal.Util.addElementClass;
        if (!self.selected) {
            fn = Methanal.Util.removeElementClass;
        }
        fn(self.node, 'selected-tab');
    },


    /**
     * Deselect the tab.
     */
    function deselect(self) {
        self.selected = false;
        self._applySelection();
    },


    /**
     * Select the tab.
     */
    function select(self) {
        self.selected = true;
        self._applySelection();
    });



/**
 * Static content tab container.
 *
 * Content is inserted at render time and doesn't change or reload.
 */
Methanal.Widgets.Tab.subclass(Methanal.Widgets, 'StaticTab');



/**
 * Dynamic content tab container.
 *
 * Content is only requested, from the server, and inserted once the tab
 * widget has been inserted into the document on the client side.
 */
Methanal.Widgets.Tab.subclass(Methanal.Widgets, 'DynamicTab').methods(
    function nodeInserted(self) {
        Methanal.Widgets.DemandTab.upcall(self, 'nodeInserted');
        self.fetchContent();
    });



/**
 * On-demand content tab container.
 *
 * Content is only requested, from the server, and inserted when the tab is
 * selected. Selecting the tab always retrieves new content; selecting the tab
 * before a previous fetch attempt has completed will result in that data being
 * discarded and a new fetch occuring.
 */
Methanal.Widgets.Tab.subclass(Methanal.Widgets, 'DemandTab').methods(
    function getLabelClassName(self) {
        return 'methanal-dynamic-tab';
    },


    function select(self) {
        Methanal.Widgets.DemandTab.upcall(self, 'select');
        self.fetchContent();
    });
