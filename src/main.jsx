import { createRoot } from 'react-dom/client'
import MapComponent from './MapComponent';
import EvacuationInfo from './EvacuationInfo';

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
  return (
    <div>
      <MapComponent />
    </div>
  );
}

function GetEvacuationInfo() {
return (
  <div>
    <EvacuationInfo />
  </div>
);
}

createRoot(document.getElementById('meow')).render(
  /* mycar.show() */
  title
)

createRoot(document.getElementById('map')).render(
  DisplayMap()
)

createRoot(document.getElementById('woof')).render(
  GetEvacuationInfo()
)