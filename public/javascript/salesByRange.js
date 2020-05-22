document.getElementsByClassName('update-data')[0].addEventListener('click', function() {
    let date = {
        startDate: document.getElementsByClassName('date-input__start-date')[0].value,
        endDate: document.getElementsByClassName('date-input__end-date')[0].value
    };

    loadDataSales(date.startDate, date.endDate);
});

function loadDataSales(startDate, endDate) {
    fetch('salesByRange', {
        method: 'POST',
        body: JSON.stringify({
            startDate : startDate || '', 
            endDate: endDate || ''
        }),
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json'
        }
    }).then(res => {
        if(!res.err) {
            return res.json();
        } else {
            alert(res.err);
        }
    }).then(body => {
        if(body) {
            let bodyElem = document.getElementsByClassName('custom-table__body')[0];
            bodyElem.innerHTML = '';
            for (let i = 0; i < body.length; i++) {
                let row = document.createElement('div');
                    row.className = 'row';
                let rowData = createRowData(body[i]);

                for(let j = 0; j < rowData.length; j++) {
                    row.append(rowData[j]);
                }

                bodyElem.append(row);
            }
        }
    });
}

// TODO переделать на цикл
function createRowData(row) {
    let columnName = document.createElement('div');
        columnName.className = 'row__data';
        columnName.setAttribute('data-label', 'Наим.');
        columnName.innerText = row.product;
    let columnСategory = document.createElement('div');
        columnСategory.className = 'row__data';
        columnСategory.setAttribute('data-label', 'Катег.');
        columnСategory.innerText = row.category;
    let columnAmount = document.createElement('div');
        columnAmount.className = 'row__data';
        columnAmount.setAttribute('data-label', 'Цена.');
        columnAmount.innerText = row.amount;
    let columnCount = document.createElement('div');
        columnCount.className = 'row__data count';
        columnCount.setAttribute('data-label', 'Кол-во.');
        columnCount.innerText = row.count;
    let columnUser = document.createElement('div');
        columnUser.className = 'row__data';
        columnUser.setAttribute('data-label', 'Польз.');
        columnUser.innerText = `${row.first_name} ${row.surname}`;
    let columnDate = document.createElement('div');
        columnDate.className = 'row__data';
        columnDate.setAttribute('data-label', 'Дата');
        columnDate.innerText = new Date(row.date).toLocaleDateString();
    return [columnName, columnСategory, columnAmount, columnCount, columnUser, columnDate];
}

loadDataSales();