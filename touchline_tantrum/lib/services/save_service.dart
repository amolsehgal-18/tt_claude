import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/career_save.dart';

class SaveService {
  // Maximum number of career slots per user
  static const int maxCareerSlots = 5;

  // Save career to local storage only
  Future<void> saveCareer(CareerSave career) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final careersJson = prefs.getString('local_careers') ?? '[]';
      final List<dynamic> careers = jsonDecode(careersJson);

      // Update or add this career
      careers.removeWhere((c) => c['id'] == career.id);
      careers.add(career.toJson());

      await prefs.setString('local_careers', jsonEncode(careers));
    } catch (e) {
      debugPrint('Error saving career: $e');
      rethrow;
    }
  }

  // Load all careers for a user
  Future<List<CareerSave>> loadCareers(String userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final careersJson = prefs.getString('local_careers') ?? '[]';
      final List<dynamic> careers = jsonDecode(careersJson);

      return careers
          .where((c) => c['userId'] == userId)
          .map((c) => CareerSave.fromJson(c as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('Error loading careers from local storage: $e');
      return [];
    }
  }

  // Get specific career by ID
  Future<CareerSave?> getCareer(String userId, String careerId) async {
    try {
      final careers = await loadCareers(userId);
      final career = careers.where((c) => c.id == careerId).toList();
      if (career.isNotEmpty) {
        return career.first;
      }
      return null;
    } catch (e) {
      debugPrint('Error getting career: $e');
      return null;
    }
  }

  // Delete career
  Future<void> deleteCareer(String userId, String careerId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final careersJson = prefs.getString('local_careers') ?? '[]';
      final List<dynamic> careers = jsonDecode(careersJson);

      careers.removeWhere((c) => c['id'] == careerId);
      await prefs.setString('local_careers', jsonEncode(careers));
    } catch (e) {
      debugPrint('Error deleting career: $e');
      rethrow;
    }
  }

  // Check if user can create more careers
  Future<bool> canCreateCareer(String userId) async {
    final careers = await loadCareers(userId);
    return careers.length < maxCareerSlots;
  }
}
