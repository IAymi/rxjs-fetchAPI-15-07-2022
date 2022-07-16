// Import stylesheets
import './style.css';
console.clear();
// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById('app');
appDiv.innerHTML = `<h1>TypeScript Starter</h1>`;

// setting for look like rxjs
interface Observer {
  next: (value: any) => void;
  error: (err: any) => void;
  complete: () => void;
}

type TearDown = () => void;
class Subscription {
  teardownList: TearDown[] = [];
  constructor(teardown?: TearDown) {
    if (teardown) {
      this.teardownList.push(teardown);
    }
  }

  add(subscription: Subscription) {
    this.teardownList.push(() => subscription.unsubscribe());
  }

  unsubscribe() {
    this.teardownList.forEach((teardown) => teardown());
    this.teardownList = [];
  }
}
class Observable {
  subscriber: (observer: Observer) => TearDown;
  constructor(subscriber: (observer: Observer) => TearDown) {
    this.subscriber = subscriber;
  }

  subscribe(observer: Observer) {
    const teardown: TearDown = this.subscriber(observer);
    const subscription = new Subscription(teardown);
    return subscription;
  }
}

function fromPromise<T>(promise: Promise<T>) {
  return new Observable((observer) => {
    let closed = false;
    promise
      .then((data) => {
        if (!closed) {
          observer.next(data);
          observer.complete();
        }
      })
      .catch((err) => {
        observer.error(err);
      });

    return () => {
      closed = true;
    };
  });
}

function forkJoin(sourceList: Observable[]) {
  return new Observable((observer) => {
    const buffer = [];
    let completeActive = 0;
    const subscription = new Subscription();
    sourceList.forEach((source, index) => {
      subscription.add(
        source.subscribe({
          next: (value: any) => (buffer[index] = value),
          error: (err: any) => observer.error(err),
          complete: () => {
            completeActive++;
            if (completeActive === sourceList.length) {
              observer.next(buffer);
              observer.complete();
            }
          },
        })
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  });
}

const observer: Observer = {
  next: (value: any) => console.log('observer next', value),
  error: (err: any) => console.log('observer error', err),
  complete: () => console.log('observer complete'),
};

const book1$ = fromPromise(
  fetch('https://www.anapioficeandfire.com/api/books/1', {
    method: 'GET',
  })
);
const book2$ = fromPromise(
  fetch('https://www.anapioficeandfire.com/api/books/2', {
    method: 'GET',
  })
);
const book3$ = fromPromise(
  fetch('https://www.anapioficeandfire.com/api/books/3', {
    method: 'GET',
  })
);

// const source = forkJoin([book1$, book2$, book3$]);
// source.subscribe(observer);

function RequestOneBook(source: Observable) {
  console.log('subscribe!');
  return new Observable((observer) => {
    const subscription = new Subscription();
    source.subscribe({
      next: (value: any) => {
        observer.next(value);
      },
      error: (err: any) => {
        observer.error(err);
      },
      complete: () => {
        observer.complete();
      },
    });

    return () => {
      console.log('unsubscribe');
    };
  });
}

const source1 = RequestOneBook(book1$);
source1.subscribe(observer);
