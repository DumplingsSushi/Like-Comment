# Like-Comment
User authentication authorization and crud operations.

## Description
This project is an Express.js application that serves as a simple blogging platform. Users can register, log in, create posts, like and comment on posts. The application uses MongoDB for data storage, bcrypt for password hashing, and express-session for session management.

## Features
- User registration and login with validation
- Session management
- Create, view, like, and comment on posts
- File upload for post images

## Prerequisites
- Node.js (v12.0 or higher)
- MongoDB (v4.0 or higher)

## Installation

1. Download and open the file in vs code :
    ```sh
    open terminal and type
    npm init --y
    ```

2. Install dependencies:
    ```sh
    npm install mongodb mongoose ejs path express bcrypt connect-mongodb-session dotenv express-session multer nodemon
    ```

3. Go to package.json file and all the following code in scripts block  :
    ```env
    "start": "nodemon src/index.js",
    ```

4. Make sure MongoDB is running on your local machine. You can start it using:
    ```sh
    mongod
    ```

## Running the Application

1. Start the server, go to the terminal and enter the following code :
    ```sh
    npm run dev 
    ```

2. Open your browser and go to `http://localhost:5000`.or ctrl click on the link in the terminal and you're ready to use the code 


```

## Models

### User (collection)
```js
const signupSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    emailId: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    confirmPassword: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
```

### Post
```js
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    photo: String,
    artist: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'collection' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'like' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comment' }]
});
```

### Like
```js
const likeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'collection' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});
```

### Comment
```js
const commentSchema = new mongoose.Schema({
    content: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'collection' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});
```

## Routes

### Registration
- GET `/` - Render registration form
- POST `/register` - Handle user registration

### Login
- GET `/login` - Render login form
- POST `/login` - Handle user login

### Posts
- GET `/posts` - View all posts
- GET `/uploadpost` - Render post upload form
- POST `/posts` - Handle post creation
- POST `/like` - Handle post liking
- POST `/comment` - Handle post commenting

### Logout
- POST `/logout` - Handle user logout

## Middleware
- `isAuth` - Middleware to check if the user is authenticated
