with open('scratch/build_categorias_info.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazar los wrappers de imágenes por la clase CSS
content = content.replace(
    'style={{{{ margin: "1.5rem 0" }}}}',
    'className="detail-image-container"'
)

# Reemplazar los estilos inline de img por nada
content = content.replace(
    ' style={{{{ width: "100%", borderRadius: "12px", border: "1px solid var(--border-color)" }}}}',
    ''
)

with open('scratch/build_categorias_info.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("build_categorias_info.py cleaned successfully.")
