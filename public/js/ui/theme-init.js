// Apply the remembered admin theme before building the page (also when storage is blocked).
(()=>{try{const value=localStorage.getItem('tutien.admin.theme');if(value==='light'||value==='dark'){document.body.dataset.theme=value;document.documentElement.style.colorScheme=value;}}catch{}})();
