import 'package:flutter/material.dart';
import '../utils/constants.dart';
// import '../services/auth_service.dart';  // Commented out for testing
import 'career_select_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  // final AuthService _authService = AuthService();  // Commented out
  bool _isLoading = false;
  // String? _errorMessage; // Removed

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isLoading = true;
      // _errorMessage = null; // Removed
    });

    // final user = await _authService.signInWithGoogle(); // Removed

    // Simulate sign-in delay
    await Future.delayed(const Duration(milliseconds: 500));

    if (mounted) {
      // Navigate directly to career select screen (no Firebase)
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const CareerSelectScreen()),
      );
    }
    // else if (mounted) { // Removed
    //   setState(() { // Removed
    //     _errorMessage = 'Failed to sign in with Google'; // Removed
    //     _isLoading = false; // Removed
    //   }); // Removed
    // } // Removed
  }

  Future<void> _handleAppleSignIn() async {
    setState(() {
      _isLoading = true;
      // _errorMessage = null; // Removed
    });

    // final user = await _authService.signInWithApple(); // Removed

    // Simulate sign-in delay
    await Future.delayed(const Duration(milliseconds: 500));

    if (mounted) {
      // Navigate directly to career select screen (no Firebase)
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const CareerSelectScreen()),
      );
    }
    // else if (mounted) { // Removed
    //   setState(() { // Removed
    //     _errorMessage = 'Failed to sign in with Apple'; // Removed
    //     _isLoading = false; // Removed
    //   }); // Removed
    // } // Removed
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                "TOUCHLINE TANTRUM",
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: kNeonYellow,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Sign in to save your progress",
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 60),
              if (_isLoading)
                const CircularProgressIndicator(color: kNeonYellow)
              else ...[
                // Google Sign-In Button (UI only, no Firebase)
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 30,
                      vertical: 15,
                    ),
                    minimumSize: const Size(280, 50),
                  ),
                  onPressed: _handleGoogleSignIn,
                  icon: const Icon(Icons.g_mobiledata, size: 30),
                  label: const Text(
                    "Sign in with Google",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Apple Sign-In Button (UI only, no Firebase)
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 30,
                      vertical: 15,
                    ),
                    minimumSize: const Size(280, 50),
                    side: const BorderSide(color: Colors.white, width: 1),
                  ),
                  onPressed: _handleAppleSignIn,
                  icon: const Icon(Icons.apple, size: 30),
                  label: const Text(
                    "Sign in with Apple",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
              // if (_errorMessage != null) ...[ // Removed
              //   const SizedBox(height: 30), // Removed
              //   Text( // Removed
              //     _errorMessage!, // Removed
              //     style: const TextStyle(color: Colors.red), // Removed
              //     textAlign: TextAlign.center, // Removed
              //   ), // Removed
              // ], // Removed
              const SizedBox(height: 60),
              const Text(
                "Your data is stored securely\nand never shared",
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white38,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
