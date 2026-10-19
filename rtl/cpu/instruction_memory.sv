`timescale 1ns / 1ps
//////////////////////////////////////////////////////////////////////////////////
// Project : QuantumRISC
// Module  : Instruction Memory
// Author  : Chandu Vemula
//
// Description:
// 256 x 32-bit Read-Only Instruction Memory.
//
// Features:
// - Word-aligned addressing
// - 256 instruction locations
// - Combinational read
// - Supports $readmemh() for loading programs
//////////////////////////////////////////////////////////////////////////////////

module instruction_memory (

    input  logic [31:0] address,
    output logic [31:0] instruction

);

    //------------------------------------------------------------
    // 256 x 32-bit Instruction Memory
    //------------------------------------------------------------
    logic [31:0] memory [0:255];
    integer i;
    //------------------------------------------------------------
    // Initialize Memory
    //------------------------------------------------------------
    initial begin

        // Sample RISC-V instructions

        memory[0] = 32'h00A00093;   // ADDI x1,x0,10
        memory[1] = 32'h01400113;   // ADDI x2,x0,20
        memory[2] = 32'h002081B3;   // ADD  x3,x1,x2
        memory[3] = 32'h40118233;   // SUB  x4,x3,x1

        // Remaining memory = NOP

        
 
        for(i=4; i<256; i=i+1)
            memory[i] = 32'h00000013; // NOP (ADDI x0,x0,0)

        // Later we can replace the above with:
        //
        // $readmemh("program.hex", memory);
        //
    end

    //------------------------------------------------------------
    // Combinational Read
    //------------------------------------------------------------
    assign instruction = memory[address[9:2]];

endmodule