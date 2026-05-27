Evaluación de Seguridad — App Streamlit

Instrucciones rápidas:

1. Crear entorno e instalar dependencias:

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

2. Ejecutar la app:

```bash
streamlit run app.py
```

3. **Datos precargados (recomendado):** el archivo `Evaluación de proyectos estratégicos_ SEGURIDAD.xlsx` debe estar en la carpeta `data/`. La app lo carga automáticamente al abrir — no hace falta subirlo cada vez.

4. Opcional: en el panel lateral puedes subir otro Excel para reemplazarlo solo en esa sesión, o pulsar **Recargar datos** después de actualizar el archivo en disco.

5. La app genera el "Resumen comparativo" y permite exportar un CSV para Power BI.

**Ruta personalizada:** define la variable de entorno `SEGURIDAD_EXCEL` con la ruta completa a tu archivo.
