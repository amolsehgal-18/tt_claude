import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';

class ShareService {
  final ScreenshotController screenshotController = ScreenshotController();

  Future<void> shareScreenshot(RenderBox? box) async {
    final image = await screenshotController.capture();
    if (image == null) return;

    final directory = await getApplicationDocumentsDirectory();
    final imageFile = await File('${directory.path}/screenshot.png').create();
    await imageFile.writeAsBytes(image);

    if (box != null) {
      await Share.shareXFiles(
        [XFile(imageFile.path)],
        sharePositionOrigin: box.localToGlobal(Offset.zero) & box.size,
      );
    }
  }
}
