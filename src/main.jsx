import { createRoot } from 'react-dom/client'

const title = (
  <h1>Live Map</h1>
);

class Car {
  constructor(name) {
    this.brand = name;
  }

  present() {
    return 'I have a ' + this.brand;
  }
}

class Model extends Car {
  constructor(name, mod) {
    super(name);
    this.model = mod;
  }  
  show() {
      return this.present() + ', it is a ' + this.model
  }

  hello = (val) => "Hello " + val;
}

const mycar = new Model("Ford", "Mustang");

const fruitlist = ['apple', 'banana', 'cherry'];

function MyList() {
  return (
    <ul>
      {fruitlist.map(fruit => 
        <li key={fruit}>{fruit}</li>
      )}
    </ul>
  );
}



createRoot(document.getElementById('meow')).render(
  /* mycar.show() */
  title
)

createRoot(document.getElementById('woof')).render(
  MyList()
)