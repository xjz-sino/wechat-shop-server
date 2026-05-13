from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/hearts', methods=['GET'])
def get_hearts():
    count = request.args.get('count', default=20, type=int)
    colors = [
        '#ff4d6d', '#c9184a', '#ff8fa3', '#ffb3c1',
        '#ff6b6b', '#ee5a5a', '#ff4757', '#ff3838',
        '#ff69b4', '#ff1493', '#db7093', '#c71585'
    ]
    hearts = []
    for i in range(count):
        hearts.append({
            'id': i,
            'size': random.randint(15, 50),
            'color': random.choice(colors),
            'left': random.randint(0, 100),
            'duration': random.randint(3, 8),
            'delay': random.randint(0, 5)
        })
    return jsonify(hearts)

if __name__ == '__main__':
    app.run(debug=True, port=5000)