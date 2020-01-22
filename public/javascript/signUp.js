document.getElementsByClassName('sign-up-form')[0].addEventListener('submit', event => {
    event.preventDefault();
    if(checkEmail(event) && checkTelephone(event) && checkPassword(event)) {
        console.log('success');

    }
});

/** Проверка email*/
function checkEmail(event) {
    if(event.target[3].value.match(/^[\w]{1}[\w-\.]*@[\w-]+\.[a-z]{2,10}$/i)) {
        return true;
    } else {
        event.target[3].style.border = "1px solid red";
        return false;
    }
}

/** Проверка телефона на длину > 10, содержание только цифр, скобок, дефисов */
function checkTelephone(event) {
    if(event.target[4].value.match(/^\d[\d\(\)\ -]{4,14}\d$/) && event.target[4].value.length == 10) {
        return true;
    } else {
        event.target[4].style.border = "1px solid red";
        return false;
    }
}

/** Проверка пароля на длину > 6, содержание латинских символов и цифр */
function checkPassword(event) {
    if(event.target[5].value.match(/(?=.*[0-9]{2,})(?=.*[a-z])[0-9a-z]{6,}/g)) {
        return true;
    } else {
        event.target[5].style.border = "1px solid red";
        return false;
    }
}