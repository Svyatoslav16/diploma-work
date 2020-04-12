// в addEventListener не используются стрелочные функции чтобы получить this 
document.getElementsByClassName('sign-up-form')[0].addEventListener('submit', function () {
    event.preventDefault();
    if (checkFullName(this.children[1].children[0].value) &&
        checkFullName(this.children[2].children[0].value) &&
        checkFullName(this.children[3].children[0].value) &&
        checkEmail(this.children[4].children[0].value) &&
        checkTelephone(this.children[5].children[0].value) &&
        checkPassword(this.children[6].children[0].value)) {
        this.action = '/signUp';
        this.method = 'POST';
        this.submit();
    }
});

document.getElementsByName('surname')[0].addEventListener('input', function() {
    if( checkFullName(this.value) ) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        this.nextElementSibling.className = "surname-label material-design-label-for-input valid";
    } else if(this.value.length > 0) {
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        this.nextElementSibling.nextElementSibling.className = "cross-icon active";
        this.nextElementSibling.className = "surname-label material-design-label-for-input";
    } else if(this.value.length === 0) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
});
document.getElementsByName('name')[0].addEventListener('input', function() {
    if( checkFullName(this.value) ) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        this.nextElementSibling.className = "name-label material-design-label-for-input valid";
    } else if(this.value.length > 0) {
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        this.nextElementSibling.nextElementSibling.className = "cross-icon active";
        this.nextElementSibling.className = "name-label material-design-label-for-input";
    } else if(this.value.length === 0) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
});
document.getElementsByName('patronymic')[0].addEventListener('input', function() {
    if( checkFullName(this.value) ) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        this.nextElementSibling.className = "patronymic-label material-design-label-for-input valid";
    } else if(this.value.length > 0) {
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        this.nextElementSibling.nextElementSibling.className = "cross-icon active";
        this.nextElementSibling.className = "patronymic-label material-design-label-for-input";
    } else if(this.value.length === 0) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
});
document.getElementsByName('email')[0].addEventListener('input', function() {
    if( checkEmail(this.value) ) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        this.nextElementSibling.className = "email-label material-design-label-for-input valid";
    } else if(this.value.length > 0) {
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        this.nextElementSibling.nextElementSibling.className = "cross-icon active";
        this.nextElementSibling.className = "email-label material-design-label-for-input";
    } else if(this.value.length === 0) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
});
document.getElementsByName('password')[0].addEventListener('input', function() {
    if( checkPassword(this.value) ) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        this.nextElementSibling.className = "password-label material-design-label-for-input valid";
    } else if(this.value.length > 0) {
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        this.nextElementSibling.nextElementSibling.className = "cross-icon active";
        this.nextElementSibling.className = "password-label material-design-label-for-input";
    } else if(this.value.length === 0) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
});
document.getElementsByName('telephone')[0].addEventListener('input', function() {
    if( checkTelephone(this.value) ) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        this.nextElementSibling.className = "telephone-label material-design-label-for-input valid";
    } else if(this.value.length > 0) {
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        this.nextElementSibling.nextElementSibling.className = "cross-icon active";
        this.nextElementSibling.className = "telephone-label material-design-label-for-input";
    } else if(this.value.length === 0) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
});

/** Проверка логина по email или номеру*/
function checkEmail(login) {
    return ( login.match(/^[\w]{1}[\w-\.]*@[\w-]+\.[a-z]{2,10}$/i) ) ? true : false;  
}

/** Проверка пароля на длину > 6, содержание латинских символов и цифр */
function checkPassword(password) {
    return ( password.match(/(?=.*[0-9]{2,})(?=.*[a-z])[0-9a-z]{6,}/g) ) ? true : false;
}

/** Проверка номера на номер с началом 8 и 10 цифрами после*/
function checkTelephone(telephone) {
    return ( telephone.match(/^8[0-9]{10}$/) ) ? true : false;
}

/** Проверка фамилии, имени и отчества на содержание только букв кириллицы */
function checkFullName(name) {
    return ( name.match(/^[А-Яа-я]+$/) ) ? true : false;
}