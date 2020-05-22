setTimeout(() => {
    let screenSaver = document.querySelector('.screen-saver');
    if(screenSaver) {
        screenSaver.style.opacity = '0';
        setTimeout(() => {
            screenSaver.remove();
        }, 1000);
    }
}, 2000);