
// fn log_callback(
//     scope: &mut v8::HandleScope,
//     args: v8::FunctionCallbackArguments,
//     mut _retval: v8::ReturnValue,
//   ) {
//     let message = args
//       .get(0)
//       .to_string(scope)
//       .unwrap()
//       .to_rust_string_lossy(scope);
  
//     println!("Logged: {}", message);
//   }

fn fetch(url: &str) -> Result<reqwest::blocking::Response, reqwest::Error> {
    let resp = reqwest::blocking::get(url)?;
    let maybe_err = resp.error_for_status_ref().err();
        // .await?
        // .text()
        // .await?;
        match maybe_err {
            Some(e) => Err(e),
            None => Ok(resp),
        }
}


fn test(test_text: &str) -> String {
    // Assemble the Javascript, beginning with the headers
    let mut code = String::from(include_str!("framework.js"));
    code.push_str(test_text);
    code.push_str("\nJSON.stringify(results)");

    let platform = v8::new_default_platform(0, false).make_shared();
    v8::V8::initialize_platform(platform);
    v8::V8::initialize();
    
    let isolate = &mut v8::Isolate::new(Default::default());
    
    let scope = &mut v8::HandleScope::new(isolate);

    let global = v8::ObjectTemplate::new(scope);
    // global.set(
    //      v8::String::new(scope, "foo").unwrap().into(),
    //      v8::String::new(scope, "100").unwrap().into(),
    // );
    // global.set(
    //     v8::String::new(scope, "test").unwrap().into(),
    //     v8::String::new(scope, "{\"foo\": 999}").unwrap().into(),
    // );
    // global.set(
    //     v8::String::new(scope, "log").unwrap().into(),
    //     v8::FunctionTemplate::new(scope, log_callback).into(),
    // );

    let context = v8::Context::new_from_template(scope, global);
    let scope = &mut v8::ContextScope::new(scope, context);

    let v8_code = v8::String::new(scope, &code).unwrap();
    let script = v8::Script::compile(scope, v8_code, None).unwrap();
    let result = script.run(scope).unwrap();
    // return result.to_string(scope).unwrap();
    return result.to_rust_string_lossy(scope);
}


fn main() {
    let resp = fetch("https://www.google.com");
    println!("{:#?}", resp);

    let foo = test(r#####"
        describe('foo', () => {
            it('should equal 100', () => {
                console.trace('In test #%d...', 1);
                // assert.equal(foo, 100);
                expect(foo).to.equal(100);
            });
        });
    "#####);
    println!("result: {}", foo);
}
