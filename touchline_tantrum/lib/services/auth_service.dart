// Mock User class to replace Firebase User
class User {
  final String uid;
  final String? email;
  final String? displayName;
  final String? photoURL;

  User({
    required this.uid,
    this.email,
    this.displayName,
    this.photoURL,
  });
}

class AuthService {
  // Simple mock user for testing
  final User _mockUser = User(
    uid: "test_manager_123",
    email: "test@touchlinetantrum.com",
    displayName: "Test Manager",
  );

  // Get current user
  User? get currentUser => _mockUser;

  // Auth state changes stream
  Stream<User?> get authStateChanges => Stream.value(_mockUser);

  // Mock Sign in with Google
  Future<User?> signInWithGoogle() async {
    return _mockUser;
  }

  // Mock Sign in with Apple
  Future<User?> signInWithApple() async {
    return _mockUser;
  }

  // Sign out
  Future<void> signOut() async {
    // Do nothing in mock
  }

  // Check if user is signed in
  bool isSignedIn() {
    return true;
  }
}
