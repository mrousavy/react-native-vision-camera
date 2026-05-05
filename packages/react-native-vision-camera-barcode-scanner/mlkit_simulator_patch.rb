 
MLKIT_SIMULATOR_POD_PREFIXES = %w[
  GoogleMLKit
  MLKitBarcodeScanning
  MLKitVision
  MLKitCommon
  MLImage
  GoogleDataTransport
  GoogleUtilities
  GoogleUtilitiesComponents
  GTMSessionFetcher
  PromisesObjC
  Protobuf
  nanopb
].freeze

def patch_mlkit_for_simulator(installer)
  installer.pods_project.targets.each do |t|
    next unless MLKIT_SIMULATOR_POD_PREFIXES.any? { |p| t.name.start_with?(p) }
    t.build_configurations.each do |c|
      # Don't compile/link MLKit pods for any simulator arch.
      c.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64 x86_64'
    end
  end

  installer.aggregate_targets.each do |agg|
    agg.user_build_configurations.each_key do |config|
      xcconfig_path = agg.xcconfig_path(config)
      next unless File.exist?(xcconfig_path)
      contents = File.read(xcconfig_path)

      # 1) Remove `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64` that MLKit pods
      #    inject via `user_target_xcconfig`. Without this Xcode hides every
      #    arm64 simulator from the run-destination dropdown on Apple Silicon.
      contents = contents.gsub(
        /^EXCLUDED_ARCHS\[sdk=iphonesimulator\*\][^\n]*\n/, ''
      )

      # 2) Strip MLKit/Google framework + library link flags from the simulator
      #    link line so the linker doesn't try to resolve missing simulator
      #    slices. Device link line is unaffected.
      mlkit_token = /(?:MLKit\w*|GoogleMLKit|MLImage|GoogleDataTransport|GoogleUtilities|GoogleUtilitiesComponents|GTMSessionFetcher|PromisesObjC|Protobuf|nanopb)/

      strip_mlkit = lambda do |line|
        # Drop `-framework "Foo"` and `-weak_framework "Foo"` pairs.
        line = line.gsub(/-(?:weak_)?framework\s+"#{mlkit_token}"/, '')
        # Drop `-l"foo"` entries.
        line = line.gsub(/-l"#{mlkit_token}"/, '')
        # Tidy up double spaces left behind.
        line.gsub(/[ \t]{2,}/, ' ')
      end

      sim_ldflags_line = contents.lines.find { |l|
        l.start_with?('OTHER_LDFLAGS[sdk=iphonesimulator')
      }
      if sim_ldflags_line.nil?
        base_line = contents.lines.find { |l| l.start_with?('OTHER_LDFLAGS =') } || "OTHER_LDFLAGS = \n"
        sim_ldflags_line = base_line.sub('OTHER_LDFLAGS', 'OTHER_LDFLAGS[sdk=iphonesimulator*]')
      else
        contents = contents.sub(sim_ldflags_line, '')
      end

      # Drop `$(inherited)` so the simulator override fully replaces the
      # unconditional `OTHER_LDFLAGS` (which still references MLKit on device).
      # If `$(inherited)` is left in, Xcode concatenates the two values and
      # the simulator linker still tries to find MLKit/Google libs.
      sim_ldflags_line = sim_ldflags_line.sub(/\$\(inherited\)\s*/, '')

      filtered = strip_mlkit.call(sim_ldflags_line).rstrip

      File.write(xcconfig_path,
        contents.rstrip + "\n" +
        filtered + "\n" +
        # 3) Belt-and-braces: explicitly clear EXCLUDED_ARCHS for the simulator
        #    so any inherited value from Xcode defaults or other xcconfigs is
        #    overridden — this is what makes arm64 simulators show up in the
        #    Xcode run-destination dropdown again.
        "EXCLUDED_ARCHS[sdk=iphonesimulator*] = \n"
      )
    end
  end
end
