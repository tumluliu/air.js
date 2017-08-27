/* @flow */

var renderRow = function(container, data) {
    var row = container.insertRow();
    data.forEach(function(str) {
        var cell = row.insertCell();
        cell.textContent = str;
    });
    return row;
};

var renderHeader = function(container, data) {
    var row = container.insertRow();
    data.forEach(function(str) {
        var th = document.createElement("th");
        th.innerHTML = str;
        row.appendChild(th);
    });
    return row;
};

var TableControl = function(
    element /* TableElement */ /*: Object */,
    headers /*: [string] */,
    model /*: ?[[string]] */
) {
    renderHeader(element.createTHead(), headers);
    this.tbody = element.createTBody();
    this.bind(model || []);
};

TableControl.prototype.clear = function() {
    while (this.tbody.hasChildNodes()) {
        this.tbody.removeChild(this.tbody.firstChild);
    }
};

TableControl.prototype.onSelected = function(handler) {
    this.onSelectedHandler = handler;
};

TableControl.prototype.bind = function(model) {
    this.clear();
    // deal with closure
    var self = this;
    model.forEach(function(data) {
        var row = renderRow(self.tbody, data);
        row.addEventListener("click", function() {
            if (self.onSelectedHandler) {
                self.onSelectedHandler(data);
                document.querySelectorAll("tr").forEach(function(tr) {
                    tr.className = "";
                });
                this.className += " selected";
            }
        });
    });
};

module.exports = TableControl;
