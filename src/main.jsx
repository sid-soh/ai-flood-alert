import { createRoot } from 'react-dom/client'

const title = (
  <h1>Live Map</h1>
);

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

function DisplayMap() {
  
}

createRoot(document.getElementById('meow')).render(
  /* mycar.show() */
  title
)

createRoot(document.getElementById('woof')).render(
  MyList()
)