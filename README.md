# Online Bookstore System Design

## Team Member Duties

- **Alice**: Database Schema Design and SQL Query Development
- **Bob**: Data Ingestion and Validation
- **Charlie**: API Development and Integration
- **Diana**: User Interface Design and Review System Implementation

## Required Tables and Data

### 1. Customers
| Attribute        | Data Type      |
|------------------|----------------|
| CustomerID       | INT            |
| Name             | VARCHAR(100)   |
| Email            | VARCHAR(100)   |
| DateJoined       | DATE           |
| TotalSpent       | DECIMAL(10, 2) |

### 2. Books
| Attribute        | Data Type      |
|------------------|----------------|
| BookID           | INT            |
| Title            | VARCHAR(200)   |
| AuthorID         | INT            |
| PublisherID      | INT            |
| Genre            | VARCHAR(50)    |
| PublishedDate    | DATE           |
| Price            | DECIMAL(10, 2) |
| Format           | ENUM('Physical', 'Ebook', 'Audiobook') |

### 3. Authors
| Attribute        | Data Type      |
|------------------|----------------|
| AuthorID         | INT            |
| Name             | VARCHAR(100)   |
| Biography        | TEXT           |

### 4. Publishers
| Attribute        | Data Type      |
|------------------|----------------|
| PublisherID      | INT            |
| Name             | VARCHAR(100)   |
| Address          | VARCHAR(200)   |

### 5. Reviews
| Attribute        | Data Type      |
|------------------|----------------|
| ReviewID         | INT            |
| CustomerID       | INT            |
| BookID           | INT            |
| Rating           | INT            |
| Comment          | TEXT           |
| ReviewDate       | DATE           |

## Sample Database Creation

```sql
CREATE DATABASE bookstore;

CREATE TABLE Customers (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Email VARCHAR(100),
    DateJoined DATE,
    TotalSpent DECIMAL(10, 2)
);

CREATE TABLE Authors (
    AuthorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Biography TEXT
);

CREATE TABLE Publishers (
    PublisherID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Address VARCHAR(200)
);

CREATE TABLE Books (
    BookID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(200),
    AuthorID INT,
    PublisherID INT,
    Genre VARCHAR(50),
    PublishedDate DATE,
    Price DECIMAL(10, 2),
    Format ENUM('Physical', 'Ebook', 'Audiobook'),
    FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID),
    FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID)
);

CREATE TABLE Reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT,
    BookID INT,
    Rating INT,
    Comment TEXT,
    ReviewDate DATE,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (BookID) REFERENCES Books(BookID)
);
```

## CRUD Operations

```sql
INSERT INTO Customers (Name, Email, DateJoined, TotalSpent)
VALUES ('John Doe', 'john@example.com', '2023-01-15', 250.00);

INSERT INTO Authors (Name, Biography)
VALUES ('J.K. Rowling', 'British author, best known for the Harry Potter series');

INSERT INTO Publishers (Name, Address)
VALUES ('Bloomsbury Publishing', '50 Bedford Square, London');

INSERT INTO Books (Title, AuthorID, PublisherID, Genre, PublishedDate, Price, Format)
VALUES ('Harry Potter and the Philosopher''s Stone', 1, 1, 'Fantasy', '1997-06-26', 20.00, 'Physical');

INSERT INTO Reviews (CustomerID, BookID, Rating, Comment, ReviewDate)
VALUES (1, 1, 5, 'Great book!', '2024-06-09');

SELECT * FROM Customers WHERE CustomerID = 1;

UPDATE Customers
SET TotalSpent = 300.00
WHERE CustomerID = 1;

DELETE FROM Customers WHERE CustomerID = 1;

```

## SQL Queries for Requirements

### 1. Power Writers
```sql
SELECT AuthorID, Name
FROM Authors
WHERE AuthorID IN (
    SELECT AuthorID
    FROM Books
    WHERE Genre = 'Fantasy' AND PublishedDate >= NOW() - INTERVAL 2 YEAR
    GROUP BY AuthorID
    HAVING COUNT(BookID) > 5
);
```

### 2. Loyal Customers
```sql
SELECT CustomerID, Name
FROM Customers
WHERE TotalSpent > 200 AND DateJoined >= NOW() - INTERVAL 1 YEAR;
```

### 3. Well Reviewed Books
```sql
SELECT BookID, Title
FROM Books
WHERE BookID IN (
    SELECT BookID
    FROM Reviews
    GROUP BY BookID
    HAVING AVG(Rating) > (SELECT AVG(Rating) FROM Reviews)
);
```

### 4. Most Popular Genre
```sql
SELECT Genre
FROM Books
GROUP BY Genre
ORDER BY SUM(Price) DESC
LIMIT 1;
```

### 5. 10 Most Recent Reviews
```sql
SELECT ReviewID, CustomerID, BookID, Rating, Comment, ReviewDate
FROM Reviews
ORDER BY ReviewDate DESC
LIMIT 10;
```

## Typescript Interface for Modifying a Table

```typescript
import * as readline from 'readline';
import * as mysql from 'mysql';

interface Review {
    reviewID: number;
    rating: number;
    comment: string;
    reviewDate: Date;
}

const database = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bookstore'
});

database.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function executeSQL(sql: string, callback: () => void) {
    database.query(sql, (err, result) => {
        if (err) {
            console.error('Error executing SQL:', err);
            return;
        }
        console.log('SQL executed successfully');
        console.log('Result:', result);
        callback();
    });
}

function validateReview(review: Review): void {
    if (!Number.isInteger(review.reviewID) || review.reviewID <= 0) {
        throw new Error('Invalid reviewID');
    }
    if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
        throw new Error('Invalid rating');
    }
    if (typeof review.comment !== 'string' || review.comment.trim() === '') {
        throw new Error('Invalid comment');
    }
    if (!(review.reviewDate instanceof Date) || isNaN(review.reviewDate.getTime())) {
        throw new Error('Invalid reviewDate');
    }
}

function updateReview(review: Review, callback: () => void): void {
    try {
        validateReview(review);

        const sql = `
            UPDATE Reviews
            SET 
                Rating = ${review.rating}, 
                Comment = '${review.comment.replace(/'/g, "''")}', 
                ReviewDate = '${review.reviewDate.toISOString().split('T')[0]}'
            WHERE 
                ReviewID = ${review.reviewID};
        `;

        executeSQL(sql, callback);
        console.log('Review updated successfully');
    } catch (error) {
        console.error('Error updating review');
    }
}

function promptForReview(): void {
    rl.question('Enter rating (1-5): ', (ratingInput) => {
        const rating = parseInt(ratingInput, 10);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            console.log('Invalid rating. Rating must be a number between 1 and 5.');
            promptForReview();
            return;
        }

        rl.question('Enter comment: ', (comment) => {
            rl.question('Enter review date (YYYY-MM-DD): ', (dateInput) => {
                const reviewDate = new Date(dateInput);
                if (isNaN(reviewDate.getTime())) {
                    console.log('Invalid date format. Please enter date in YYYY-MM-DD format.');
                    promptForReview();
                    return;
                }

                const review: Review = {
                    reviewID: 1,
                    rating,
                    comment,
                    reviewDate
                };
                updateReview(review, () => {
                    rl.question('Do you want to rate again? (yes/no): ', (answer) => {
                        if (answer.toLowerCase() === 'yes') {
                            promptForReview();
                        } else {
                            rl.close();
                            console.log('Goodbye!');
                            process.exit();
                        }
                    });
                });
            });
        });
    });
}

console.log('Welcome to the review update system.');
promptForReview();
```