let message = document.querySelector('.message');

if(message !== null) {
    setTimeout(() => {
        message.remove();
    }, 2000);
}

/** Первоначальные данные с сервера. Используется querySelector, т.к. он не отслеживает актуальность данных  DOM*/
const accountData = {
    surname: document.querySelector('input[name="surname"]').value,
    name: document.querySelector('input[name="firstname"]').value,
    patronymic: document.querySelector('input[name="patronymic"]').value,
    email: document.querySelector('input[name="email"]').value,
    telephone: document.querySelector('input[name="telephone"]').value,
    password: document.querySelector('input[name="password"]').value,
    position: ''
};

const positions = document.querySelectorAll('.option');

for (let i = 0; i < positions.length; i++) {
    console.log(positions[i].children[0]);
    if(positions[i].children[0].checked === true) {
        accountData.position = positions[i].children[0].value;
        break;
    }    
}

checkFullName(document.getElementsByName('surname')[0]);
checkFullName(document.getElementsByName('firstname')[0]);
checkFullName(document.getElementsByName('patronymic')[0]);
checkEmail(document.getElementsByName('email')[0]);
checkPassword(document.getElementsByName('password')[0]);
checkTelephone(document.getElementsByName('telephone')[0]);

document.getElementsByClassName('profile_form')[0].addEventListener('submit', function () {
    event.preventDefault();
    let newAccountData = {
        surname: document.querySelector('input[name="surname"]').value,
        name: document.querySelector('input[name="firstname"]').value,
        patronymic: document.querySelector('input[name="patronymic"]').value,
        email: document.querySelector('input[name="email"]').value,
        telephone: document.querySelector('input[name="telephone"]').value,
        password: document.querySelector('input[name="password"]').value
    };
    const positions = document.querySelectorAll('.option');

    for (let i = 0; i < positions.length; i++) {
        if(positions[i].children[0].checked === true) {
            newAccountData.position = positions[i].children[0].value;
            break;
        }    
    }
    if (checkFullName(document.getElementsByName('surname')[0]) &&
        checkFullName(document.getElementsByName('firstname')[0]) &&
        checkFullName(document.getElementsByName('patronymic')[0]) &&
        checkEmail(document.getElementsByName('email')[0]) &&
        checkPassword(document.getElementsByName('password')[0]) &&
        checkTelephone(document.getElementsByName('telephone')[0])) {
        if (accountData.surname !== newAccountData.surname || 
            accountData.name !== newAccountData.name ||
            accountData.patronymic !== newAccountData.patronymic ||
            accountData.email !== newAccountData.email ||
            accountData.telephone !== newAccountData.telephone ||
            accountData.password !== newAccountData.password ||
            accountData.position !== newAccountData.position) {
            this.action = '/editWorkerProfile';
            this.method = 'POST';
            this.submit();
        } else {
            window.location.href = window.location.origin;
        }
    }
});

document.getElementsByName('surname')[0].addEventListener('input', function() {
    checkFullName(this);
});

document.getElementsByName('firstname')[0].addEventListener('input', function() {
    checkFullName(this);
});

document.getElementsByName('patronymic')[0].addEventListener('input', function() {
    checkFullName(this);
});

document.getElementsByName('email')[0].addEventListener('input', function() {
    checkEmail(this);
});

document.getElementsByName('password')[0].addEventListener('input', function() {
    checkPassword(this);
});

document.getElementsByName('telephone')[0].addEventListener('input', function() {
    checkTelephone(this);
});

/** Проверка логина по email или номеру*/
function checkEmail(login) {
    if( login.value.match(/^[\w]{1}[\w-\.]*@[\w-]+\.[a-z]{2,10}$/i) ) {
        login.nextElementSibling.nextElementSibling.className = "cross-icon";
        login.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        login.nextElementSibling.className = "email-label material-design-label-for-input valid";
        return true;
    } else if(login.value.length > 0) {
        login.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        login.nextElementSibling.nextElementSibling.className = "cross-icon active";
        login.nextElementSibling.className = "email-label material-design-label-for-input";
    } else if(login.value.length === 0) {
        login.nextElementSibling.nextElementSibling.className = "cross-icon";
        login.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }

    return false;
}

/** Проверка пароля на длину > 6, содержание латинских символов и цифр */
function checkPassword(password) {
    if( password.value.match(/(?=.*[0-9]{2,})(?=.*[a-z])[0-9a-z]{6,}/g) ) {
        password.nextElementSibling.nextElementSibling.className = "cross-icon";
        password.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        password.nextElementSibling.className = "password-label material-design-label-for-input valid";
        return true;
    } else if(password.value.length > 0) {
        password.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        password.nextElementSibling.nextElementSibling.className = "cross-icon active";
        password.nextElementSibling.className = "password-label material-design-label-for-input";
    } else if(password.value.length === 0) {
        password.nextElementSibling.nextElementSibling.className = "cross-icon";
        password.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
    return false;
}

/** Проверка номера на номер с началом 8 и 10 цифрами после*/
function checkTelephone(telephone) {
    if( telephone.value.match(/^8[0-9]{10}$/) ) {
        telephone.nextElementSibling.nextElementSibling.className = "cross-icon";
        telephone.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        telephone.nextElementSibling.className = "telephone-label material-design-label-for-input valid";
        return true;
    } else if(telephone.value.length > 0) {
        telephone.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        telephone.nextElementSibling.nextElementSibling.className = "cross-icon active";
        telephone.nextElementSibling.className = "telephone-label material-design-label-for-input";
    } else if(telephone.value.length === 0) {
        telephone.nextElementSibling.nextElementSibling.className = "cross-icon";
        telephone.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
    return false;
}

/** Проверка фамилии, имени и отчества на содержание только букв кириллицы */
function checkFullName(name) {
    if( name.value.match(/^[А-Яа-я]+$/) ) {
        name.nextElementSibling.nextElementSibling.className = "cross-icon";
        name.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        name.nextElementSibling.className = "full_name-label material-design-label-for-input valid";
        return true;
    } else if(name.value.length > 0) {
        name.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        name.nextElementSibling.nextElementSibling.className = "cross-icon active";
        name.nextElementSibling.className = "full_name-label material-design-label-for-input";
    } else if(name.value.length === 0) {
        name.nextElementSibling.nextElementSibling.className = "cross-icon";
        name.nextElementSibling.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
    return false;
}