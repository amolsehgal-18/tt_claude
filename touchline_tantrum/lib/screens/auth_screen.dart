import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;
import '../services/auth_service.dart';
import '../utils/constants.dart';
import 'setup_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final AuthService _authService = AuthService();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final user = await _authService.signInWithGoogle();
      if (user != null && mounted) _goToSetup();
    } on AuthException catch (e) {
      if (mounted) setState(() => _errorMessage = e.message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleAppleSignIn() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final user = await _authService.signInWithApple();
      if (user != null && mounted) _goToSetup();
    } on AuthException catch (e) {
      if (mounted) setState(() => _errorMessage = e.message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleGuestSignIn() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final user = await _authService.signInAsGuest();
      if (user != null && mounted) _goToSetup();
    } on AuthException catch (e) {
      if (mounted) setState(() => _errorMessage = e.message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _goToSetup() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const SetupScreen()),
    );
  }

  bool get _isApplePlatform =>
      defaultTargetPlatform == TargetPlatform.iOS ||
      defaultTargetPlatform == TargetPlatform.macOS;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background
          Positioned.fill(
            child: Image.asset(
              'assets/images/backgrounds/stadium/pitch.png',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: kBlack),
            ),
          ),
          Positioned.fill(
            child: Container(color: Colors.black.withAlpha(178)),
          ),
          // Content
          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'TOUCHLINE',
                      style: TextStyle(
                        fontSize: 38,
                        fontWeight: FontWeight.w900,
                        color: kNeonYellow,
                        letterSpacing: 4,
                      ),
                    ),
                    const Text(
                      'TANTRUM',
                      style: TextStyle(
                        fontSize: 38,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 4,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Sign in to save your career across devices',
                      style: TextStyle(fontSize: 14, color: Colors.white54),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 60),

                    if (_isLoading)
                      const CircularProgressIndicator(color: kNeonYellow)
                    else ...[
                      // Google Sign-In
                      _AuthButton(
                        icon: Icons.g_mobiledata,
                        iconSize: 28,
                        label: 'Continue with Google',
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black87,
                        onTap: _handleGoogleSignIn,
                      ),
                      const SizedBox(height: 14),

                      // Apple Sign-In (iOS/macOS only)
                      if (_isApplePlatform) ...[
                        _AuthButton(
                          icon: Icons.apple,
                          iconSize: 24,
                          label: 'Continue with Apple',
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          border: const BorderSide(color: Colors.white54),
                          onTap: _handleAppleSignIn,
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Guest / Anonymous
                      _AuthButton(
                        icon: Icons.sports_soccer,
                        iconSize: 22,
                        label: 'Play as Guest',
                        backgroundColor: kSlateBlue,
                        foregroundColor: Colors.white70,
                        onTap: _handleGuestSignIn,
                      ),

                      if (_errorMessage != null) ...[
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red.withAlpha(50),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.red.shade700),
                          ),
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              color: Colors.redAccent,
                              fontSize: 13,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ],

                    const SizedBox(height: 40),
                    const Text(
                      'Your data is stored securely and never shared',
                      style: TextStyle(fontSize: 11, color: Colors.white24),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthButton extends StatelessWidget {
  final IconData icon;
  final double iconSize;
  final String label;
  final Color backgroundColor;
  final Color foregroundColor;
  final BorderSide? border;
  final VoidCallback onTap;

  const _AuthButton({
    required this.icon,
    required this.iconSize,
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
    required this.onTap,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 300,
      height: 52,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(6),
            side: border ?? BorderSide.none,
          ),
        ),
        onPressed: onTap,
        icon: Icon(icon, size: iconSize),
        label: Text(
          label,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
