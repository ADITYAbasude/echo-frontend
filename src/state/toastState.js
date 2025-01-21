const { atom } = require("recoil");

export const setVisible = atom({
    key: 'visible',
    default: {
        message: '',
        type: 'SUCCESS',
        visible: false        
    }
})