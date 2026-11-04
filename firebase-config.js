/* =========================================================
   CONFIGURACIÓN — Panel Huellitas
   1) Crea tu proyecto en https://console.firebase.google.com
   2) Agrega una app web (</>) y copia aquí los datos de "firebaseConfig"
   3) Mientras apiKey diga "PEGA_AQUI", el panel funciona en MODO DEMO
      (los datos se guardan solo en este navegador).
   ========================================================= */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCjeEIJyyiRazDauZ3eRj6-DSLgcu8OQco",
  authDomain: "veterinaria-245b6.firebaseapp.com",
  projectId: "veterinaria-245b6",
  storageBucket: "veterinaria-245b6.firebasestorage.app",
  messagingSenderId: "704214343131",
  appId: "1:704214343131:web:5ae7193aa58893c0da5bfe"
};

/* Datos de la veterinaria que usa el panel */
window.APP = {
  nombre: "Huellitas Veterinaria",
  prefijoCodigo: "HV",   // los códigos saldrán como HV-7K3P9
  portal: "https://zikopro820.github.io/veterinaria/mi-mascota",   // página pública Mi Mascota
  veterinarios: ["Dra. Carla Méndez", "Dr. Andrés Salas", "Dra. Paola Gutiérrez", "Grooming · Luis R."],
  sedes: ["Sede Miraflores · Consultorio 1", "Sede Miraflores · Consultorio 2", "Sede Miraflores · Sala de procedimientos", "Sede Miraflores · Grooming"],
  servicios: ["Consulta general", "Vacunación", "Desparasitación", "Baño y peluquería", "Odontología / limpieza dental",
              "Cirugía", "Esterilización", "Laboratorio", "Ecografía / rayos X", "Control post operatorio", "Atención a domicilio", "Emergencia"],
  vacunas: ["Antirrábica", "Séxtuple (DHPPI+L)", "Bordetella (tos de las perreras)", "Triple Felina", "Leucemia Felina", "Parvovirus (cachorro)", "Moquillo"]
};
