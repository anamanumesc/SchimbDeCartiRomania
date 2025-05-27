// backend/controllers/exchangeController.js
const { executeQuery, mssql } = require('../services/database');

// Simple error handler
const handleError = (res, error, message) => {
  console.error(`${message}:`, error);
  res.status(500).json({ error: message });
};

// Creează o cerere de schimb
exports.createExchangeRequest = async (req, res) => {
  try {
    console.log('Exchange request received:', req.body);
    console.log('User from token:', req.user);
    
    const { requestedBookId, offeredBookIds, message } = req.body;
    const requesterUserId = req.user.id;

    // Validare date
    if (!requestedBookId || !offeredBookIds || !Array.isArray(offeredBookIds) || offeredBookIds.length === 0) {
      return res.status(400).json({ error: 'Datele pentru schimb sunt incomplete' });
    }

    // Verifică dacă cartea cerută există și obține ID-ul proprietarului
    const targetBook = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('bookId', mssql.Int, requestedBookId)
        .query('SELECT userId FROM Books WHERE id = @bookId');
      return result.recordset[0];
    });

    if (!targetBook) {
      return res.status(404).json({ error: 'Cartea cerută nu există' });
    }

    if (targetBook.userId === requesterUserId) {
      return res.status(400).json({ error: 'Nu poți cere schimbul propriei cărți' });
    }

    // Verifică dacă utilizatorul deține cărțile oferite
    const userBooks = await executeQuery(async (pool) => {
      const placeholders = offeredBookIds.map((_, index) => `@bookId${index}`).join(',');
      const request = pool.request();
      
      offeredBookIds.forEach((bookId, index) => {
        request.input(`bookId${index}`, mssql.Int, bookId);
      });
      request.input('userId', mssql.Int, requesterUserId);

      const result = await request.query(
        `SELECT id FROM Books 
        WHERE id IN (${placeholders}) AND userId = @userId`
      );
      return result.recordset;
    });

    if (userBooks.length !== offeredBookIds.length) {
      return res.status(400).json({ error: 'Nu deții toate cărțile pe care vrei să le oferi' });
    }

    // Verifică dacă nu există deja o cerere de schimb activă pentru aceeași carte
    const existingRequest = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('requestedBookId', mssql.Int, requestedBookId)
        .input('requesterUserId', mssql.Int, requesterUserId)
        .query(
          `SELECT id FROM Exchanges 
          WHERE requestedBookId = @requestedBookId 
          AND requesterUserId = @requesterUserId 
          AND status = 'pending'`
        );
      return result.recordset[0];
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Ai deja o cerere de schimb activă pentru această carte' });
    }

    // Creează cererea de schimb
    const exchangeId = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('requestedBookId', mssql.Int, requestedBookId)
        .input('offeredBookIds', mssql.NVarChar(255), offeredBookIds.join(','))
        .input('requesterUserId', mssql.Int, requesterUserId)
        .input('targetUserId', mssql.Int, targetBook.userId)
        .input('message', mssql.NVarChar(1000), message || '')
        .query(
          `INSERT INTO Exchanges (requestedBookId, offeredBookIds, requesterUserId, targetUserId, message)
          VALUES (@requestedBookId, @offeredBookIds, @requesterUserId, @targetUserId, @message);
          SELECT SCOPE_IDENTITY() AS id;`
        );
      return result.recordset[0].id;
    });

    res.status(201).json({ 
      id: exchangeId,
      message: 'Cererea de schimb a fost trimisă cu succes!' 
    });

  } catch (error) {
    handleError(res, error, 'Eroare la crearea cererii de schimb');
  }
};

// Obține cererile de schimb pentru utilizatorul curent (cereri primite)
exports.getReceivedRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('userId', mssql.Int, userId)
        .query(
          `SELECT 
            e.id,
            e.requestedBookId,
            e.offeredBookIds,
            e.message,
            e.status,
            e.createdAt,
            rb.title AS requestedBookTitle,
            rb.author AS requestedBookAuthor,
            ru.name AS requesterName,
            ru.email AS requesterEmail
          FROM Exchanges e
          JOIN Books rb ON e.requestedBookId = rb.id
          JOIN Users ru ON e.requesterUserId = ru.id
          WHERE e.targetUserId = @userId
          ORDER BY e.createdAt DESC`
        );

      // Pentru fiecare cerere, obține detaliile cărților oferite
      const requests = result.recordset;
      
      for (let request of requests) {
        const offeredBookIds = request.offeredBookIds.split(',').map(id => parseInt(id));
        
        const offeredBooks = await executeQuery(async (pool) => {
          const placeholders = offeredBookIds.map((_, index) => `@bookId${index}`).join(',');
          const bookRequest = pool.request();
          
          offeredBookIds.forEach((bookId, index) => {
            bookRequest.input(`bookId${index}`, mssql.Int, bookId);
          });

          const bookResult = await bookRequest.query(
            `SELECT id, title, author, imageUrl 
            FROM Books 
            WHERE id IN (${placeholders})`
          );
          return bookResult.recordset;
        });

        request.offeredBooks = offeredBooks;
      }

      return requests;
    });

    res.json(requests);

  } catch (error) {
    handleError(res, error, 'Eroare la obținerea cererilor de schimb');
  }
};

// Obține cererile de schimb trimise de utilizatorul curent
exports.getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('userId', mssql.Int, userId)
        .query(
          `SELECT 
            e.id,
            e.requestedBookId,
            e.offeredBookIds,
            e.message,
            e.status,
            e.createdAt,
            rb.title AS requestedBookTitle,
            rb.author AS requestedBookAuthor,
            ru.name AS targetUserName
          FROM Exchanges e
          JOIN Books rb ON e.requestedBookId = rb.id
          JOIN Users ru ON e.targetUserId = ru.id
          WHERE e.requesterUserId = @userId
          ORDER BY e.createdAt DESC`
        );

      return result.recordset;
    });

    res.json(requests);

  } catch (error) {
    handleError(res, error, 'Eroare la obținerea cererilor trimise');
  }
};

// Acceptă o cerere de schimb
exports.acceptExchangeRequest = async (req, res) => {
  try {
    const exchangeId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(exchangeId)) {
      return res.status(400).json({ error: 'ID invalid pentru schimb' });
    }

    // Verifică dacă cererea există și aparține utilizatorului
    const exchange = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('exchangeId', mssql.Int, exchangeId)
        .input('userId', mssql.Int, userId)
        .query(
          `SELECT * FROM Exchanges 
          WHERE id = @exchangeId AND targetUserId = @userId AND status = 'pending'`
        );
      return result.recordset[0];
    });

    if (!exchange) {
      return res.status(404).json({ error: 'Cererea de schimb nu a fost găsită sau nu îți aparține' });
    }

    // Actualizează statusul cererii
    await executeQuery(async (pool) => {
      await pool.request()
        .input('exchangeId', mssql.Int, exchangeId)
        .query(
          `UPDATE Exchanges 
          SET status = 'accepted', updatedAt = GETDATE() 
          WHERE id = @exchangeId`
        );
    });

    res.json({ message: 'Cererea de schimb a fost acceptată!' });

  } catch (error) {
    handleError(res, error, 'Eroare la acceptarea cererii de schimb');
  }
};

// Respinge o cerere de schimb
exports.rejectExchangeRequest = async (req, res) => {
  try {
    const exchangeId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(exchangeId)) {
      return res.status(400).json({ error: 'ID invalid pentru schimb' });
    }

    // Verifică dacă cererea există și aparține utilizatorului
    const exchange = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('exchangeId', mssql.Int, exchangeId)
        .input('userId', mssql.Int, userId)
        .query(
          `SELECT * FROM Exchanges 
          WHERE id = @exchangeId AND targetUserId = @userId AND status = 'pending'`
        );
      return result.recordset[0];
    });

    if (!exchange) {
      return res.status(404).json({ error: 'Cererea de schimb nu a fost găsită sau nu îți aparține' });
    }

    // Actualizează statusul cererii
    await executeQuery(async (pool) => {
      await pool.request()
        .input('exchangeId', mssql.Int, exchangeId)
        .query(
          `UPDATE Exchanges 
          SET status = 'rejected', updatedAt = GETDATE() 
          WHERE id = @exchangeId`
        );
    });

    res.json({ message: 'Cererea de schimb a fost respinsă!' });

  } catch (error) {
    handleError(res, error, 'Eroare la respingerea cererii de schimb');
  }
};