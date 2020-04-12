// Получение всех товаров
fetch('/getProducts').then(res => {
    if(res.ok) {
        return res.json();
    } else {
        alert(`Ошибка HTTP ${res.status}`);
    }
}).then(body => {
    const categoriesSelect = document.getElementsByClassName('categories')[0];
    const optionsListCategories = categoriesSelect.children[0].children[0].children;
    let products = document.getElementsByClassName('products')[0];

    let optionsContainerProducts = products.getElementsByClassName('options-container')[0];

    products.children[0].children[1].addEventListener('click', function() {        
        if(this.previousElementSibling.children.length > 0) {
            this.previousElementSibling.classList.toggle('active');
        }
    });

    for(let i = 0; i < optionsListCategories.length; i++) {
        optionsListCategories[i].addEventListener('click', function() {
            optionsContainerProducts.innerText = '';
            products.children[0].children[1].innerHTML = 'Выберите товар';

            for (let j = 0; j < body.length; j++) {
                if(body[j].product_category_id == optionsListCategories[i].children[0].value) {
                    let option = document.createElement('div');
                    option.className = 'option';
                    
                    let optionInput = document.createElement('input'); 
                    optionInput.type = 'radio';
                    optionInput.className = 'radio';
                    optionInput.name = 'id';
                    optionInput.value = body[j].product_id;
                    optionInput.required = 'required';

                    let optionlabel = document.createElement('label');
                    optionlabel.innerText = body[j].product_name;

                    option.append(optionInput);
                    option.append(optionlabel);

                    optionsContainerProducts.append(option);

                    option.addEventListener('click', function() {
                        this.children[0].checked = 'true';
                        products.children[0].children[1].innerHTML = this.children[1].innerHTML;
                        optionsContainerProducts.classList.remove('active');
                    });
                }
            }
        });
    }
});