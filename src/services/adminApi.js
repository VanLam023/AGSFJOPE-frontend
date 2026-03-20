import axiosClient from './axiosClient';

const importExcel = (file) => {
    const formData = new FormData();
    
    formData.append('file', file);

    const res = axiosClient.post("/admin/users/import-excel", formData);

    return res;
};

export { importExcel };
