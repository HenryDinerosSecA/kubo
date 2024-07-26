let books = [];
let currentBook = null;
let isGuest = false;
let archivedPages = [];
let currentSortField = 'createdAt';
let currentSortOrder = 'desc';


const landingPrompt = document.getElementById('landingPrompt');
const booksView = document.getElementById('booksView');
const pagesView = document.getElementById('pagesView');
const authButton = document.getElementById('authButton');
const signInButton = document.getElementById('signInButton');
const guestButton = document.getElementById('guestButton');
const newPageButton = document.getElementById('newPageButton');
const bookList = document.getElementById('bookList');
const pageList = document.getElementById('pageList');
const currentBookTitle = document.getElementById('currentBookTitle');
const archiveLink = document.getElementById('archiveLink');
const toggleSidebar = document.getElementById('toggleSidebar');
const sideNav = document.getElementById('sideNav');
const mobileHomeButton = document.getElementById('mobileHomeButton');
const mobileArchiveLink = document.getElementById('mobileArchiveLink');


authButton.addEventListener('click', showAuthModal);
signInButton.addEventListener('click', showAuthModal);
guestButton.addEventListener('click', useAsGuest);
newPageButton.addEventListener('click', showNewPageModal);
archiveLink.addEventListener('click', showArchive);
toggleSidebar.addEventListener('click', () => {
    sideNav.classList.toggle('show');
});
mobileHomeButton.addEventListener('click', showBooksView);
mobileArchiveLink.addEventListener('click', showArchive);

document.getElementById('newBookForm').addEventListener('submit', createNewBook);
document.getElementById('newPageForm').addEventListener('submit', createNewPage);
document.getElementById('logo').addEventListener('click', showBooksView);
document.getElementById('sortField').addEventListener('change', (e) => {
    currentSortField = e.target.value;
    renderPages();
});
document.getElementById('sortOrder').addEventListener('click', (e) => {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    e.target.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
    renderPages();
});

function saveToLocalStorage() {
    localStorage.setItem('kuboBooks', JSON.stringify(books));
    localStorage.setItem('kuboArchive', JSON.stringify(archivedPages));
    localStorage.setItem('kuboIsGuest', JSON.stringify(isGuest));
}


function loadFromLocalStorage() {
    const storedBooks = localStorage.getItem('kuboBooks');
    const storedArchive = localStorage.getItem('kuboArchive');
    const storedIsGuest = localStorage.getItem('kuboIsGuest');

    if (storedBooks) books = JSON.parse(storedBooks);
    if (storedArchive) archivedPages = JSON.parse(storedArchive);
    if (storedIsGuest) isGuest = JSON.parse(storedIsGuest);

    if (isGuest) {
        landingPrompt.style.display = 'none';
        booksView.style.display = 'flex';
        loadBooks();
    }
}

function showAuthModal() {
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
}

function useAsGuest() {
    isGuest = true;
    landingPrompt.style.display = 'none';
    booksView.style.display = 'flex';
    loadBooks();
    saveToLocalStorage();
}

function loadBooks() {
    if (books.length === 0) {
        books = [];
    }
    renderBooks();
}

function renderBooks() {
    booksView.innerHTML = '';
    const bookContainer = document.createElement('div');
    bookContainer.className = 'd-flex flex-wrap justify-content-center';

    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-card card';
        bookElement.innerHTML = `
            ${book.photo ? `<img src="${book.photo}" class="book-image card-img-top" alt="${book.name}">` : ''}
            <div class="book-title card-body">
                <h5 class="card-title">${book.name}</h5>
            </div>
            <button class="btn btn-sm btn-outline-primary edit-book-btn">Edit Book</button>
        `;
        bookElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('edit-book-btn')) {
                openBook(book);
            }
        });
        bookElement.querySelector('.edit-book-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            editBook(book);
        });
        bookContainer.insertBefore(bookElement, bookContainer.firstChild);
    });

    const newBookElement = document.createElement('div');
    newBookElement.className = 'book-card card';
    newBookElement.innerHTML = `
        <div class="book-title card-body d-flex align-items-center justify-content-center">
            <h5 class="card-title">Create New Book</h5>
        </div>
        <button class="btn btn-primary">+</button>
    `;
    newBookElement.addEventListener('click', showNewBookModal);
    bookContainer.insertBefore(newBookElement, bookContainer.firstChild);

    booksView.appendChild(bookContainer);
}

function enableDragAndDrop() {
    const bookContainer = document.querySelector('#booksView > div');
    bookContainer.addEventListener('dragstart', dragStart);
    bookContainer.addEventListener('dragover', dragOver);
    bookContainer.addEventListener('drop', drop);
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.bookId);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text');
    const droppedOn = e.target.closest('.book-card');
    if (droppedOn && draggedId !== droppedOn.dataset.bookId) {
        const draggedIndex = books.findIndex(b => b.id.toString() === draggedId);
        const droppedIndex = books.findIndex(b => b.id.toString() === droppedOn.dataset.bookId);
        [books[draggedIndex], books[droppedIndex]] = [books[droppedIndex], books[draggedIndex]];
        saveToLocalStorage();
        renderBooks();
    }
}

function showNewBookModal() {
    const newBookModal = new bootstrap.Modal(document.getElementById('newBookModal'));
    newBookModal.show();
}

function editBook(book) {
    const modal = new bootstrap.Modal(document.getElementById('editBookModal'));
    const form = document.getElementById('editBookForm');
    const titleInput = document.getElementById('editBookName');
    const photoInput = document.getElementById('editBookPhoto');
    const deleteBtn = document.getElementById('deleteBookBtn');

    titleInput.value = book.name;
    photoInput.value = book.photo || '';

    form.onsubmit = (e) => {
        e.preventDefault();
        book.name = titleInput.value;
        book.photo = photoInput.value;
        saveToLocalStorage();
        renderBooks();
        renderSidebar();
        if (currentBook && currentBook.id === book.id) {
            currentBookTitle.textContent = book.name;
        }
        modal.hide();
    };

    deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this book?')) {
            const index = books.findIndex(b => b.id === book.id);
            if (index !== -1) {
                books.splice(index, 1);
                saveToLocalStorage();
                renderBooks();
                if (currentBook && currentBook.id === book.id) {
                    showBooksView();
                } else {
                    renderSidebar();
                }
                modal.hide();
            }
        }
    };

    modal.show();
}


function createNewBook(event) {
    event.preventDefault();
    const name = document.getElementById('bookName').value;
    const photo = document.getElementById('bookPhoto').value;
    const newBook = { id: Date.now(), name, photo, groups: [{ id: 'default', name: 'Default', pages: [] }] };
    books.push(newBook);
    renderBooks();
    saveToLocalStorage();
    bootstrap.Modal.getInstance(document.getElementById('newBookModal')).hide();
}

function openBook(book) {
    currentBook = book;
    currentBook.pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    booksView.style.display = 'none';
    pagesView.style.display = 'flex';
    currentBookTitle.textContent = book.name;
    currentBookTitle.innerHTML += ` <button class="btn btn-sm btn-outline-primary edit-book-btn ms-2">Edit</button>`;
    currentBookTitle.querySelector('.edit-book-btn').addEventListener('click', () => editBook(book));
    renderSidebar();
    renderPages();
}

function renderSidebar() {
    bookList.innerHTML = `
        <li class="nav-item">
            <a class="nav-link" href="#" id="homeButton">Home</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#" id="archiveLink">Archive</a>
        </li>
        <li class="nav-item"><hr class="dropdown-divider"></li>
    `;
    document.getElementById('homeButton').addEventListener('click', showBooksView);
    document.getElementById('archiveLink').addEventListener('click', showArchive);

    books.forEach(book => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = `
            <a class="nav-link ${book.id === currentBook?.id ? 'active' : ''}" href="#">
                ${book.name}
            </a>
        `;
        li.querySelector('a').addEventListener('click', () => openBook(book));
        bookList.appendChild(li);
    });
}


function showBooksView() {
    booksView.style.display = 'flex';
    pagesView.style.display = 'none';
    currentBook = null;
    renderBooks();
    document.querySelectorAll('#bookList .nav-link, #mobileHomeButton').forEach(link => link.classList.remove('active'));
    document.getElementById('homeButton').classList.add('active');
    document.getElementById('mobileHomeButton').classList.add('active');
    sideNav.classList.remove('show');
}
function renderPages() {
    pageList.innerHTML = '';
    if (currentBook === null) {
        document.getElementById('newPageButton').style.display = 'none';
        renderArchivedPages();
        return;
    }

    document.getElementById('newPageButton').style.display = 'block';
    document.getElementById('newPageButton').style.marginBottom = '1rem';

    if (!currentBook.pages || currentBook.pages.length === 0) {
        pageList.innerHTML = '<p class="text-center mt-4">No pages yet. Create a new page to get started!</p>';
        return;
    }

    const sortedPages = currentBook.pages.sort((a, b) => {
        let comparison = 0;
        if (currentSortField === 'deadline') {
            const aValue = a[currentSortField] || '9999-99-99';
            const bValue = b[currentSortField] || '9999-99-99';
            comparison = aValue.localeCompare(bValue);
        } else if (currentSortField === 'createdAt') {
            comparison = new Date(b.createdAt) - new Date(a.createdAt);
        } else {
            comparison = a[currentSortField].localeCompare(b[currentSortField]);
        }
        return currentSortOrder === 'desc' ? comparison * -1 : comparison;
    });

    sortedPages.forEach(page => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${page.title}</span>
                <div>
                    <button class="btn btn-sm btn-outline-primary edit-btn me-2">Edit</button>
                    <button class="btn btn-sm btn-outline-secondary archive-btn">Archive</button>
                </div>
            </div>
            <div class="page-details mt-2" style="display: none;">
                <p><strong>Category:</strong> ${page.category}</p>
                <p><strong>Deadline:</strong> ${page.deadline || 'N/A'}</p>
                <p><strong>Created:</strong> ${new Date(page.createdAt).toLocaleString()}</p>
                <div class="page-content">${page.details}</div>
            </div>
        `;
        li.addEventListener('click', (e) => {
            if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('archive-btn')) {
                li.querySelector('.page-details').style.display = li.querySelector('.page-details').style.display === 'none' ? 'block' : 'none';
            }
        });
        li.querySelector('.edit-btn').addEventListener('click', () => editPage(page));
        li.querySelector('.archive-btn').addEventListener('click', () => archivePage(page));
        pageList.appendChild(li);
    });
}

function showNewPageModal() {
    const newPageModal = new bootstrap.Modal(document.getElementById('newPageModal'));
    newPageModal.show();
}

function createNewPage(event) {
    event.preventDefault();
    const title = document.getElementById('pageTitle').value;
    const category = document.getElementById('pageCategory').value;
    const deadline = document.getElementById('pageDeadline').value;
    const details = tinymce.get('pageDetails').getContent();
    
    const newPage = {
        id: Date.now(),
        title,
        category,
        deadline,
        details,
        createdAt: new Date().toISOString()
    };
    
    currentBook.pages.push(newPage);
    renderPages();
    saveToLocalStorage();
    bootstrap.Modal.getInstance(document.getElementById('newPageModal')).hide();
    
    document.getElementById('newPageForm').reset();
    tinymce.get('pageDetails').setContent('');
}

function archivePage(page) {
    const pageIndex = currentBook.pages.findIndex(p => p.id === page.id);
    if (pageIndex !== -1) {
        const archivedPage = currentBook.pages.splice(pageIndex, 1)[0];
        archivedPage.originalBook = currentBook.id;
        archivedPages.push(archivedPage);
        renderPages();
        saveToLocalStorage();
    }
}

function editPage(page) {
    const modal = new bootstrap.Modal(document.getElementById('editPageModal'));
    const form = document.getElementById('editPageForm');
    const titleInput = document.getElementById('editPageTitle');
    const categoryInput = document.getElementById('editPageCategory');
    const deadlineInput = document.getElementById('editPageDeadline');
    const deleteBtn = document.getElementById('deletePageBtn');

    titleInput.value = page.title;
    categoryInput.value = page.category;
    deadlineInput.value = page.deadline || '';
    
    modal.show();
    setTimeout(() => {
        tinymce.get('editPageDetails').setContent(page.details);
    }, 100);

    deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this page?')) {
            const index = currentBook.pages.findIndex(p => p.id === page.id);
            if (index !== -1) {
                currentBook.pages.splice(index, 1);
                saveToLocalStorage();
                renderPages();
                modal.hide();
            }
        }
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        page.title = titleInput.value;
        page.category = categoryInput.value;
        page.deadline = deadlineInput.value;
        page.details = tinymce.get('editPageDetails').getContent();
        saveToLocalStorage();
        renderPages();
        modal.hide();
    };
}

function showArchive() {
    currentBook = null;
    booksView.style.display = 'none';
    pagesView.style.display = 'flex';
    currentBookTitle.textContent = 'Archive';
    renderSidebar();
    renderPages();
    document.querySelectorAll('#bookList .nav-link, #mobileArchiveLink').forEach(link => link.classList.remove('active'));
    document.getElementById('archiveLink').classList.add('active');
    document.getElementById('mobileArchiveLink').classList.add('active');
    sideNav.classList.remove('show');
}

function renderArchivedPages() {
    pageList.innerHTML = '';
    if (archivedPages.length === 0) {
        pageList.innerHTML = '<p class="text-center mt-4">No archived pages yet.</p>';
        return;
    }

    archivedPages.forEach(page => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${page.title}</span>
                <div>
                    <button class="btn btn-sm btn-outline-primary unarchive-btn me-2">Unarchive</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
                </div>
            </div>
            <div class="page-details mt-2" style="display: none;">
                <p><strong>Category:</strong> ${page.category}</p>
                <p><strong>Deadline:</strong> ${page.deadline || 'N/A'}</p>
                <p><strong>Created:</strong> ${new Date(page.createdAt).toLocaleString()}</p>
                <div class="page-content">${page.details}</div>
            </div>
        `;
        li.addEventListener('click', (e) => {
            if (!e.target.classList.contains('unarchive-btn') && !e.target.classList.contains('delete-btn')) {
                li.querySelector('.page-details').style.display = li.querySelector('.page-details').style.display === 'none' ? 'block' : 'none';
            }
        });
        li.querySelector('.unarchive-btn').addEventListener('click', () => unarchivePage(page));
        li.querySelector('.delete-btn').addEventListener('click', () => deletePage(page));
        pageList.appendChild(li);
    });
}

function unarchivePage(page) {
    const pageIndex = archivedPages.findIndex(p => p.id === page.id);
    if (pageIndex !== -1) {
        const unarchivedPage = archivedPages.splice(pageIndex, 1)[0];
        const originalBook = books.find(book => book.id === unarchivedPage.originalBook);
        if (originalBook) {
            delete unarchivedPage.originalBook;
            originalBook.pages.push(unarchivedPage);
        } else {
            books[0].pages.push(unarchivedPage);
        }
        renderArchivedPages();
        saveToLocalStorage();
    }
}

function deletePage(page) {
    const pageIndex = archivedPages.findIndex(p => p.id === page.id);
    if (pageIndex !== -1) {
        archivedPages.splice(pageIndex, 1);
        renderArchivedPages();
        saveToLocalStorage();
    }
}

function setTheme() {
    const hour = new Date().getHours();
    const body = document.body;
    
    if (hour >= 6 && hour < 12) {
        body.className = 'morning';
    } else if (hour >= 12 && hour < 18) {
        body.className = 'afternoon';
    } else {
        body.className = 'night';
    }
}


loadFromLocalStorage();
setTheme();
setInterval(setTheme, 60000);

tinymce.init({
    selector: '#pageDetails',
    height: 300,
    menubar: false,
    plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount'
    ],
    toolbar: 'undo redo | formatselect | ' +
    'bold italic backcolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | help',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    setup: function(editor) {
        editor.on('init', function() {
            editor.setContent('');
        });
    }
});