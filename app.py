from flask import Flask, render_template, jsonify, request
import time

app = Flask(__name__)

class Nodo:
    def __init__(self, datos, padre=None):
        self.datos = datos
        self.padre = padre
        self.costo = 0
        self.hijos = []

    def get_datos(self):
        return self.datos

    def get_padre(self):
        return self.padre

    def get_costo(self):
        return self.costo

    def set_costo(self, costo):
        self.costo = costo

    def set_hijos(self, hijos):
        self.hijos = hijos
        for h in hijos:
            h.padre = self

    def igual(self, nodo):
        return self.datos == nodo.datos

    def en_lista(self, lista_nodos):
        for n in lista_nodos:
            if self.igual(n):
                return True
        return False

# Datos por defecto
default_companies = ["Empresa 1", "Empresa 2", "Empresa 3", "Empresa 4"]
default_wheel_types = ["TIPO T", "TIPO H", "TIPO V", "TIPO W"]
default_costs = [
    [20, 30, 20, 40], # Empresa 1
    [50, 50, 40, 50], # Empresa 2
    [60, 55, 50, 60], # Empresa 3
    [100, 80, 60, 70] # Empresa 4
]

# Almacenamiento dinámico de datos
custom_data = {
    'companies': list(default_companies),
    'wheel_types': list(default_wheel_types),
    'costs': [row[:] for row in default_costs]
}

def heuristica(datos, companies, wheel_types, costs):
    num_assigned = len(datos)
    if num_assigned == len(wheel_types):
        return 0
    
    total_h = 0
    assigned_companies = set(datos)
    
    for j in range(num_assigned, len(wheel_types)):
        min_cost = float('inf')
        for i in range(len(companies)):
            if i not in assigned_companies:
                if costs[i][j] < min_cost:
                    min_cost = costs[i][j]
        if min_cost != float('inf'):
            total_h += min_cost
    return total_h

def buscar_solucion_A(companies, wheel_types, costs):
    nodos_visitados = []
    nodos_frontera = []
    nodos_frontera.append(Nodo([]))
    
    start_time = time.time()
    iterations = 0

    while len(nodos_frontera) != 0:
        iterations += 1
        nodos_frontera.sort(key=lambda x: x.get_costo() + heuristica(x.get_datos(), companies, wheel_types, costs))
        nodo = nodos_frontera.pop(0)
        nodos_visitados.append(nodo)

        if len(nodo.get_datos()) == len(wheel_types):
            end_time = time.time()
            return nodo, iterations, (end_time - start_time)

        datos_actuales = nodo.get_datos()
        wheel_idx_to_assign = len(datos_actuales)
        hijos = []
        assigned_companies = set(datos_actuales)
        
        for i in range(len(companies)):
            if i not in assigned_companies:
                nuevos_datos = datos_actuales + [i]
                hijo = Nodo(nuevos_datos)
                hijo.set_costo(nodo.get_costo() + costs[i][wheel_idx_to_assign])
                hijos.append(hijo)

                if not hijo.en_lista(nodos_visitados):
                    if not hijo.en_lista(nodos_frontera):
                        nodos_frontera.append(hijo)
                    else:
                        for n in nodos_frontera:
                            if hijo.igual(n) and hijo.get_costo() < n.get_costo():
                                nodos_frontera.remove(n)
                                nodos_frontera.append(hijo)
                                break
        nodo.set_hijos(hijos)
    return None, iterations, 0

@app.route('/')
def index():
    return render_template('index.html', 
                         companies=custom_data['companies'], 
                         wheel_types=custom_data['wheel_types'], 
                         costs=custom_data['costs'])

@app.route('/api/data', methods=['GET'])
def get_data():
    """Obtener datos actuales"""
    return jsonify({
        'companies': custom_data['companies'],
        'wheel_types': custom_data['wheel_types'],
        'costs': custom_data['costs']
    })

@app.route('/api/update', methods=['POST'])
def update_data():
    """Actualizar datos personalizados"""
    data = request.get_json()
    
    if 'companies' in data:
        custom_data['companies'] = data['companies']
    if 'wheel_types' in data:
        custom_data['wheel_types'] = data['wheel_types']
    if 'costs' in data:
        custom_data['costs'] = data['costs']
    
    return jsonify({'message': 'Datos actualizados exitosamente'})

@app.route('/api/reset', methods=['POST'])
def reset_data():
    """Restablecer datos a valores por defecto"""
    custom_data['companies'] = list(default_companies)
    custom_data['wheel_types'] = list(default_wheel_types)
    custom_data['costs'] = [row[:] for row in default_costs]
    return jsonify({'message': 'Datos restablecidos'})

@app.route('/solve', methods=['POST'])
def solve():
    nodo_solucion, nodes_explored, time_taken = buscar_solucion_A(
        custom_data['companies'], 
        custom_data['wheel_types'], 
        custom_data['costs']
    )
    if nodo_solucion:
        resultado_indices = nodo_solucion.get_datos()
        assignments = []
        for i, comp_idx in enumerate(resultado_indices):
            assignments.append({
                "wheel": custom_data['wheel_types'][i],
                "company": custom_data['companies'][comp_idx],
                "price": custom_data['costs'][comp_idx][i]
            })
        return jsonify({
            "success": True,
            "total_cost": nodo_solucion.get_costo(),
            "assignments": assignments,
            "stats": {
                "nodes_explored": nodes_explored,
                "time_taken": f"{time_taken:.4f}s"
            }
        })
    return jsonify({"success": False})

import os

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
