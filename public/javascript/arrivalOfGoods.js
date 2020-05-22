let counterProduct = 0;
let counterCategory = 1;

// Обработчик для отправки данных на сервер
document.getElementsByClassName('arrival-of-goods-form')[0].addEventListener('submit', event => {
    event.preventDefault();
    let rowList = document.getElementsByClassName('row');
    let productList = [];
    let datetime = `${document.getElementsByName('arrivalDate')[0].value} ${document.getElementsByName('arrivalTime')[0].value}`
    for (let i = 0; i < rowList.length; i++) {
        let optionList = rowList[i].children[1].children[0].children[0].children;
        for (let j = 0; j < optionList.length; j++) {
            if(optionList[j].children[0].checked === true) {
                productList.push({id: optionList[j].children[0].value,
                                  count: rowList[i].children[2].children[1].value, 
                                  amount: rowList[i].children[3].children[1].value});
            }
        }

        if (i === rowList.length - 1 && productList.length > 0 &&
            datetime.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}$/) !== null) {
            fetch('/arrivalOfGoods', {
                method: 'POST',
                body: JSON.stringify({productList, datetime}),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                if(res.ok) {
                    window.location.href = window.location.origin;
                }
            });
        } else if(productList.length === 0) {
            alert('Выберите товары в приход');
        }
    }
});

totalCalculation();

// Добавление функционала для кастомных селектов из первой строки
document.querySelectorAll('.select-box').forEach(selectBox => {
    addEventForCustomSelect(selectBox);
});

// Первичное заполнение списка товаров из категории, добавление функции расчета итога в строке
document.querySelectorAll('.categories .select-box').forEach(el => {
    fillingListProduct(el);
    recalculation(el.parentNode.parentNode.querySelector('.count input'), el.parentNode.parentNode.querySelector('.amount input'));
});

// Добавление возможности удаления строки с помощью иконки крестика (.cross-icon) для первой строки
document.querySelectorAll('.cross-icon').forEach(el => {
    deleteRow(el);
});

// Навешивание обработчика для добавления новой строки с помощью кнопки .add-row
document.querySelectorAll('.add-row').forEach(button => {
    button.onclick = createRow;
});

// Навешивание обработчика для закрытия приходной накладной
document.querySelectorAll('.close-button').forEach(button => {
    button.onclick = closeForm;
});

/** Пересчет поля "Итог" */
function recalculation(count, amount) {
    amount.addEventListener('input', function() {
        amount.parentNode.parentNode.querySelector('.total-row').children[1].value = this.value * count.value;
        totalCalculation();
    });

    count.addEventListener('input', function() {
        count.parentNode.parentNode.querySelector('.total-row').children[1].value = this.value * amount.value;
        totalCalculation();
    });
}

// Удаление .row с помощью иконки .cross-icon 
function deleteRow(icon) {
    icon.addEventListener('click', () => {
        if(icon.parentNode.parentNode.parentNode.children.length > 1) {
            icon.parentNode.parentNode.remove();
        }
        totalCalculation();
    });
}

// Добавление новой строки  кастомную таблицу. Табуляция не сломана, а выбрана для лучшей читабельности (проверял только на VS Code)
function createRow() {
    let rowElem = document.createElement('div');
        rowElem.className = 'row';

        // Дочерние элементы
        let row__data_categories = document.createElement('div');
            row__data_categories.className = 'row__data select-wrap categories wrap';
            let select_box_categories = document.createElement('div');
                select_box_categories.className = 'select-box';
                let options_container_categories = document.createElement('div');
                    options_container_categories.className = 'options-container';
    fetch('/getCategories', {
        method: 'POST'
    }).then(res => {
        if(res.ok)
            return res.json();
        else 
            alert('Произошла ошибка при получении данных о категориях, при добавлении строки');
    }).then(body => {
        if(body) {
            for (let i = 0; i < body.length; i++) {
                let option = document.createElement('div');
                    option.className = 'option';
                    let input_radio = document.createElement('input');
                        input_radio.className = 'radio';
                        input_radio.type = 'radio';
                        // input_radio.id = body[i].name;
                        input_radio.name = `category__${counterCategory}`;
                        input_radio.value = body[i].id;
                    let label = document.createElement('label');
                        // label.for = body[i].name;
                        label.innerText = body[i].name;
                option.append(input_radio);
                option.append(label);

                options_container_categories.append(option);
            }

            let selectedElem_categories = document.createElement('div');
                selectedElem_categories.className = 'selected';
                selectedElem_categories.name = 'categories';
                selectedElem_categories.innerText = 'Категория';

                select_box_categories.append(options_container_categories);
                select_box_categories.append(selectedElem_categories);

            row__data_categories.append(select_box_categories);

            

            rowElem.append(row__data_categories);
            rowElem.innerHTML +=
                `<div class="row__data select-wrap products wrap">
                    <div class="select-box">
                        <div class="options-container">
                        </div>
                        <div class="selected" name="categories">
                            Товар
                        </div>
                    </div>
                </div>
                <div class="row__data count wrap">
                    <label>Количество</label>
                    <input type="number" name="count" min="1" max="99" value="1">
                </div>
                <div class="row__data amount wrap">
                    <label>Стоимость</label>
                    <input type="number" name="amount" min="1" value="1">
                </div>
                <div class="row__data total-row wrap">
                    <label>Итог</label>
                    <input type="text" value="1" readonly />
                </div>
                <div class="action">
                    <svg class="cross-icon icon" x="0px" y="0px" viewBox="0 0 492 492" xml:space="preserve">
                        <path d="M300.188,246L484.14,62.04c5.06-5.064,7.852-11.82,7.86-19.024c0-7.208-2.792-13.972-7.86-19.028L468.02,7.872 c-5.068-5.076-11.824-7.856-19.036-7.856c-7.2,0-13.956,2.78-19.024,7.856L246.008,191.82L62.048,7.872	c-5.06-5.076-11.82-7.856-19.028-7.856c-7.2,0-13.96,2.78-19.02,7.856L7.872,23.988c-10.496,10.496-10.496,27.568,0,38.052 L191.828,246L7.872,429.952c-5.064,5.072-7.852,11.828-7.852,19.032c0,7.204,2.788,13.96,7.852,19.028l16.124,16.116	c5.06,5.072,11.824,7.856,19.02,7.856c7.208,0,13.968-2.784,19.028-7.856l183.96-183.952l183.952,183.952 c5.068,5.072,11.824,7.856,19.024,7.856h0.008c7.204,0,13.96-2.784,19.028-7.856l16.12-16.116 c5.06-5.064,7.852-11.824,7.852-19.028c0-7.204-2.792-13.96-7.852-19.028L300.188,246z"/>
                    </svg>
                </div>`;

            document.querySelector('.table__body').append(rowElem);

            let lastSelectBoxCategory = document.querySelectorAll('.categories .select-box')[
                document.querySelectorAll('.categories .select-box').length - 1];

            fillingListProduct(lastSelectBoxCategory);
            addEventForCustomSelect(lastSelectBoxCategory);
            addEventForCustomSelect(lastSelectBoxCategory.parentNode.parentNode.querySelector('.products .select-box'));
            recalculation(lastSelectBoxCategory.parentNode.parentNode.querySelector('.count input'),
                lastSelectBoxCategory.parentNode.parentNode.querySelector('.amount input'));
            deleteRow(lastSelectBoxCategory.parentNode.parentNode.querySelector('.cross-icon'));
            totalCalculation();
            counterCategory++; // увеличение счетчика
        }
    });
}

/**  Заполнение списка товаров из категории для первой строки */
function fillingListProduct(selectBox) {
    let option = selectBox.children[0].children;

    for (let i = 0; i < option.length; i++) {
        option[i].addEventListener('click', function() {
            getProductByCategoryId(option[i].children[0].value, selectBox);
        });            
    }
}

/** Заполнение списка товаров из выбранной категории.
 * categoryId - id категории товаров, selectBoxCategory - элемент .categories .select-box */
function getProductByCategoryId(categoryId, selectBoxCategory) {
    fetch('/getProductByCategoryId', {
        method: 'POST',
        body: JSON.stringify({id: categoryId}),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(res => {
        if(!res.err)
            return res.json();
        else
            alert(res.err);
    }).then(body => {
        if(body) {
            // Элемент .products .select-box из той же строки, что и el
            let selectBoxProduct = selectBoxCategory.parentNode.parentNode.querySelector('.products .select-box');
                selectBoxProduct.children[0].innerHTML = '';
                selectBoxProduct.children[1].innerText = 'Товар';

            for(let i = 0; i < body.length; i++) {
                let option = document.createElement('div');
                    option.className = 'option';
                    let input_radio = document.createElement('input');
                        input_radio.className = 'radio';
                        input_radio.type = 'radio';
                        // input_radio.id = body[i].name;
                        input_radio.name = `product__${counterProduct}`;
                        input_radio.value = body[i].id;
                        input_radio.required = 'required';
                    let label = document.createElement('label');
                        // label.for = body[i].name;
                        label.innerText = body[i].name;
                option.append(input_radio);
                option.append(label);
                option.addEventListener('click', function() {
                    option.children[0].checked = 'true';
                    option.parentNode.parentNode.children[1].innerText = label.innerText;
                    option.parentNode.classList.remove("active");
                });

                selectBoxProduct.children[0].append(option);
            }
            counterProduct++; // увеличение счетчика
        }
    });
}

function addEventForCustomSelect(selectBox) {
    const selected = selectBox.getElementsByClassName("selected")[0];
    const optionsContainer = selectBox.getElementsByClassName("options-container")[0];
    const optionsList = selectBox.getElementsByClassName("option");
    
    selected.addEventListener("click", () => {     
        optionsContainer.classList.toggle("active");
    });

    for (let k = 0; k < optionsList.length; k++) {
        optionsList[k].addEventListener("click", () => {
            optionsList[k].children[0].checked = 'true';
            selected.innerHTML = optionsList[k].children[1].innerHTML;
            optionsContainer.classList.remove("active");
        });
    }
}

function totalCalculation() {
    let totalList = document.getElementsByClassName('total-row');
    let totalInput = document.getElementsByClassName('total__input')[0];
    let total = 0;

    for (let i = 0; i < totalList.length; i++) {
        total += +totalList[i].children[1].value;
    }

    totalInput.value = total;
}

function closeForm() {
    window.location.href = window.location.origin;
}